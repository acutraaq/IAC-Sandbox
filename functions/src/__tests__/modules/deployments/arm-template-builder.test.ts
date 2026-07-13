import { describe, it, expect } from "vitest";
import { buildArmTemplate, validateTemplateAgainstPolicy } from "../../../modules/deployments/arm-template-builder.js";
import type { DeploymentPayload } from "../../../modules/deployments/deployment.schema.js";

const TENANT_ID = "test-tenant-id";
const TAGS = { "Cost Center": "CC01", "Project ID": "PID01", "Project Owner": "owner@test.com", "Expiry Date": "2025-12-31" };
const FOUNDRY = {
  foundryApiKey: "test-foundry-key",
  foundryResourceName: "test-foundry-resource",
  foundryModelDeploymentName: "test-foundry-model",
};

function templatePayload(slug: string, formValues: Record<string, unknown> = {}): DeploymentPayload {
  return { mode: "template", tags: TAGS, template: { slug, formValues } };
}

function customPayload(type: string, name: string, config: Record<string, unknown> = {}): DeploymentPayload {
  return {
    mode: "custom",
    tags: TAGS,
    resources: [{ type, name, icon: "icon", config }],
  };
}

// ---------------------------------------------------------------------------
// buildArmTemplate — template assembly
// ---------------------------------------------------------------------------

describe("buildArmTemplate — assembly", () => {
  it("returns correct $schema and contentVersion", () => {
    const t = buildArmTemplate(templatePayload("approval-workflow", { workflowName: "mywf" }), { tenantId: TENANT_ID });
    expect(t.$schema).toBe("https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#");
    expect(t.contentVersion).toBe("1.0.0.0");
  });

  it("parameters and outputs are empty objects", () => {
    const t = buildArmTemplate(templatePayload("approval-workflow"), { tenantId: TENANT_ID });
    expect(t.parameters).toEqual({});
    expect(t.outputs).toEqual({});
  });

  it("applies tags to every resource when opts.tags provided", () => {
    const t = buildArmTemplate(templatePayload("approval-workflow", { workflowName: "tagtest" }), { tenantId: TENANT_ID, tags: TAGS });
    for (const r of t.resources) {
      expect(r.tags).toEqual(TAGS);
    }
  });

  it("does not add tags when opts.tags omitted", () => {
    const t = buildArmTemplate(templatePayload("approval-workflow"), { tenantId: TENANT_ID });
    for (const r of t.resources) {
      expect(r.tags).toBeUndefined();
    }
  });

  it("unknown template slug throws", () => {
    expect(() => buildArmTemplate(templatePayload("unknown-slug"), { tenantId: TENANT_ID })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// validateTemplateAgainstPolicy
// ---------------------------------------------------------------------------

describe("validateTemplateAgainstPolicy", () => {
  it("returns empty array for all-allowed template", () => {
    const t = buildArmTemplate(templatePayload("approval-workflow", { workflowName: "s" }), { tenantId: TENANT_ID });
    expect(validateTemplateAgainstPolicy(t)).toEqual([]);
  });

  it("returns blocked type when resource is not in policy set", () => {
    const t = buildArmTemplate(
      customPayload("Microsoft.Web/staticSites", "app"),
      { tenantId: TENANT_ID }
    );
    // inject a non-allowed type to test the validator
    t.resources.push({ type: "Microsoft.SomeBlockedService/things", apiVersion: "2023-01-01", name: "x", location: "eastus" });
    const blocked = validateTemplateAgainstPolicy(t);
    expect(blocked).toContain("Microsoft.SomeBlockedService/things");
    expect(blocked).not.toContain("Microsoft.Web/staticSites");
  });
});

// ---------------------------------------------------------------------------
// Policy-blocked template slugs
// ---------------------------------------------------------------------------

describe("policy-blocked template slugs", () => {
  it.each([
    "virtual-machine",
    "microservices-platform",
    "data-pipeline",
    "secure-api-backend",
  ])("throws PolicyBlockedTemplateError for %s", (slug) => {
    expect(() =>
      buildArmTemplate(templatePayload(slug), { tenantId: TENANT_ID })
    ).toThrow(/blocked by subscription policy/);
  });
});

// ---------------------------------------------------------------------------
// Approval Workflow (Logic App HTTP)
// ---------------------------------------------------------------------------

describe("buildApprovalWorkflow (approval-workflow template)", () => {
  it("returns 1 resource: Logic App with HTTP trigger", () => {
    const t = buildArmTemplate(
      templatePayload("approval-workflow", { workflowName: "leave-approval" }),
      { tenantId: TENANT_ID }
    );
    expect(t.resources).toHaveLength(1);
    expect(t.resources[0].type).toBe("Microsoft.Logic/workflows");
    const def = (t.resources[0] as Record<string, unknown>).properties as { definition: { triggers: Record<string, unknown> } };
    expect(def.definition.triggers).toHaveProperty("manual");
  });

  it("sanitizes workflow name", () => {
    const t = buildArmTemplate(
      templatePayload("approval-workflow", { workflowName: "My Leave Approval!!" }),
      { tenantId: TENANT_ID }
    );
    expect(t.resources[0].name).toMatch(/^[a-z0-9-]+$/);
  });

  it("does not pick up the Foundry pre-wired action (no foundry config passed for this slug)", () => {
    const t = buildArmTemplate(
      templatePayload("approval-workflow", { workflowName: "leave-approval" }),
      { tenantId: TENANT_ID }
    );
    const def = (t.resources[0] as Record<string, unknown>).properties as { definition: { actions: Record<string, unknown> } };
    expect(def.definition.actions).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Scheduled Automation (Logic App recurrence)
// ---------------------------------------------------------------------------

describe("buildScheduledAutomation (scheduled-automation template)", () => {
  it("returns 1 resource: Logic App with recurrence trigger", () => {
    const t = buildArmTemplate(
      templatePayload("scheduled-automation", { workflowName: "weekly-report", frequency: "Week", runTime: "09:00" }),
      { tenantId: TENANT_ID }
    );
    expect(t.resources).toHaveLength(1);
    expect(t.resources[0].type).toBe("Microsoft.Logic/workflows");
    const def = (t.resources[0] as Record<string, unknown>).properties as { definition: { triggers: { Recurrence: { recurrence: { frequency: string } } } } };
    expect(def.definition.triggers.Recurrence.recurrence.frequency).toBe("Week");
  });

  it("uses frequency from formValues", () => {
    const t = buildArmTemplate(
      templatePayload("scheduled-automation", { workflowName: "daily-sync", frequency: "Day" }),
      { tenantId: TENANT_ID }
    );
    const def = (t.resources[0] as Record<string, unknown>).properties as { definition: { triggers: { Recurrence: { recurrence: { frequency: string } } } } };
    expect(def.definition.triggers.Recurrence.recurrence.frequency).toBe("Day");
  });

  it("does not pick up the Foundry pre-wired action (no foundry config passed for this slug)", () => {
    const t = buildArmTemplate(
      templatePayload("scheduled-automation", { workflowName: "weekly-report" }),
      { tenantId: TENANT_ID }
    );
    const def = (t.resources[0] as Record<string, unknown>).properties as { definition: { actions: Record<string, unknown> } };
    expect(def.definition.actions).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// Static Web App
// ---------------------------------------------------------------------------

describe("buildStaticWebApp (static-web-app template)", () => {
  it("returns 1 resource: staticSites", () => {
    const t = buildArmTemplate(
      templatePayload("static-web-app", { appName: "myapp" }),
      { tenantId: TENANT_ID }
    );
    expect(t.resources).toHaveLength(1);
    expect(t.resources[0].type).toBe("Microsoft.Web/staticSites");
  });

  it("sanitizes name", () => {
    const t = buildArmTemplate(
      templatePayload("static-web-app", { appName: "My@App!" }),
      { tenantId: TENANT_ID }
    );
    expect(t.resources[0].name).toMatch(/^[a-z0-9-]+$/);
  });

  it("uses sku from formValues", () => {
    const t = buildArmTemplate(
      templatePayload("static-web-app", { appName: "myapp", sku: "Standard" }),
      { tenantId: TENANT_ID }
    );
    const sku = (t.resources[0] as Record<string, unknown>).sku as { name: string };
    expect(sku.name).toBe("Standard");
  });

  it("defaults to Free tier when no sku provided", () => {
    const t = buildArmTemplate(
      templatePayload("static-web-app", { appName: "myapp" }),
      { tenantId: TENANT_ID }
    );
    const sku = (t.resources[0] as Record<string, unknown>).sku as { name: string };
    expect(sku.name).toBe("Free");
  });
});

// ---------------------------------------------------------------------------
// Logic App (bare, no preset trigger scenario)
// ---------------------------------------------------------------------------

describe("buildLogicAppTemplate (logic-app template)", () => {
  it("returns 2 resources: Logic App with HTTP trigger and Azure OpenAI connection", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "my-workflow" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    expect(t.resources).toHaveLength(2);
    expect(t.resources[0].type).toBe("Microsoft.Logic/workflows");
    const def = (t.resources[0] as Record<string, unknown>).properties as { definition: { triggers: Record<string, unknown> } };
    expect(def.definition.triggers).toHaveProperty("manual");
  });

  it("sanitizes workflow name", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "My Workflow!!" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    expect(t.resources[0].name).toMatch(/^[a-z0-9-]+$/);
  });

  it("throws InvalidDeploymentConfigError when Foundry config is missing", () => {
    expect(() =>
      buildArmTemplate(templatePayload("logic-app", { workflowName: "my-workflow" }), { tenantId: TENANT_ID })
    ).toThrow(/Foundry API key\/resource name\/model deployment name not configured/);
  });

  it("throws InvalidDeploymentConfigError when only the model deployment name is missing", () => {
    expect(() =>
      buildArmTemplate(
        templatePayload("logic-app", { workflowName: "my-workflow" }),
        { tenantId: TENANT_ID, foundryApiKey: FOUNDRY.foundryApiKey, foundryResourceName: FOUNDRY.foundryResourceName }
      )
    ).toThrow(/Foundry API key\/resource name\/model deployment name not configured/);
  });

  it("bakes the Foundry api key and endpoint into the workflow's own parameters", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "my-workflow" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    const props = (t.resources[0] as Record<string, unknown>).properties as {
      definition: { parameters: Record<string, { type: string }> };
      parameters: Record<string, { value: string }>;
    };
    expect(props.definition.parameters.foundryApiKey).toEqual({ type: "securestring" });
    expect(props.definition.parameters.foundryEndpoint).toEqual({ type: "string" });
    expect(props.parameters.foundryApiKey).toEqual({ value: "[parameters('azureopenaiApiKey')]" });
    expect(props.parameters.foundryEndpoint).toEqual({ value: `https://${FOUNDRY.foundryResourceName}.openai.azure.com` });
  });

  it("pre-wires a working HTTP action that calls the Foundry model", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "my-workflow" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    const def = (t.resources[0] as Record<string, unknown>).properties as {
      definition: { actions: Record<string, { type: string; inputs: { method: string; uri: string; headers: Record<string, string> } }> };
    };
    expect(def.definition.actions).toHaveProperty("Call_Foundry_Model");
    const action = def.definition.actions.Call_Foundry_Model;
    expect(action.type).toBe("Http");
    expect(action.inputs.method).toBe("POST");
    expect(action.inputs.uri).toContain(FOUNDRY.foundryModelDeploymentName);
    expect(action.inputs.uri).toContain("@{parameters('foundryEndpoint')}");
    expect(action.inputs.headers["api-key"]).toBe("@parameters('foundryApiKey')");
  });

  it("registers the api key as a secureString top-level deploy parameter", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "my-workflow" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    expect(t.parameters.azureopenaiApiKey).toEqual({ type: "secureString" });
    expect(t._deployParameters?.azureopenaiApiKey).toEqual({ value: FOUNDRY.foundryApiKey });
  });

  it("builds a Microsoft.Web/connections resource with resource name and api key parameter", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "my-workflow" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    const conn = t.resources.find((r) => r.type === "Microsoft.Web/connections") as Record<string, unknown>;
    expect(conn).toBeDefined();
    const props = conn.properties as { parameterValues: { azureOpenAIResourceName: string; azureOpenAIApiKey: string } };
    expect(props.parameterValues.azureOpenAIResourceName).toBe(FOUNDRY.foundryResourceName);
    expect(props.parameterValues.azureOpenAIApiKey).toBe("[parameters('azureopenaiApiKey')]");
  });

  it("ships the connector AND the pre-wired action together, not one or the other", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "my-workflow" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    const conn = t.resources.find((r) => r.type === "Microsoft.Web/connections");
    expect(conn).toBeDefined();
    const logicApp = t.resources.find((r) => r.type === "Microsoft.Logic/workflows") as Record<string, unknown>;
    const def = logicApp.properties as { definition: { actions: Record<string, unknown> } };
    expect(def.definition.actions).toHaveProperty("Call_Foundry_Model");
  });
});

// ---------------------------------------------------------------------------
// Logic App + Storage
// ---------------------------------------------------------------------------

describe("buildLogicAppStorageTemplate (logic-app-storage template)", () => {
  it("returns 3 resources: Logic App, Storage Account, and Azure OpenAI connection", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "my-workflow", storageAccountName: "mystorage" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    expect(t.resources).toHaveLength(3);
    const types = t.resources.map((r) => r.type);
    expect(types).toContain("Microsoft.Logic/workflows");
    expect(types).toContain("Microsoft.Storage/storageAccounts");
    expect(types).toContain("Microsoft.Web/connections");
  });

  it("bakes the Foundry api key and endpoint into the workflow's own parameters", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    const logicApp = t.resources.find((r) => r.type === "Microsoft.Logic/workflows") as Record<string, unknown>;
    const props = logicApp.properties as {
      definition: { parameters: Record<string, { type: string }> };
      parameters: Record<string, { value: string }>;
    };
    expect(props.definition.parameters.foundryApiKey).toEqual({ type: "securestring" });
    expect(props.parameters.foundryEndpoint).toEqual({ value: `https://${FOUNDRY.foundryResourceName}.openai.azure.com` });
  });

  it("sanitizes all resource names independently", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "My Workflow!!", storageAccountName: "My Storage!!" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    for (const r of t.resources) {
      expect(r.name).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("defaults storage account to LRS/Hot/private when no extra config given", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    const storage = t.resources.find((r) => r.type === "Microsoft.Storage/storageAccounts") as Record<string, unknown>;
    expect((storage.sku as { name: string }).name).toBe("Standard_LRS");
    const props = storage.properties as { accessTier: string; allowBlobPublicAccess: boolean };
    expect(props.accessTier).toBe("Hot");
    expect(props.allowBlobPublicAccess).toBe(false);
  });

  it("appends the submissionId suffix to the storage account name for global uniqueness", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID, submissionId: "123e4567-e89b-12d3-a456-426614174000", ...FOUNDRY }
    );
    const storage = t.resources.find((r) => r.type === "Microsoft.Storage/storageAccounts") as Record<string, unknown>;
    expect(storage.name).toBe("store123e4567");
  });

  it("does not collide when two deployments reuse the same storage account name with different submissionIds", () => {
    const first = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID, submissionId: "123e4567-e89b-12d3-a456-426614174000", ...FOUNDRY }
    );
    const second = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID, submissionId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", ...FOUNDRY }
    );
    const firstStorage = first.resources.find((r) => r.type === "Microsoft.Storage/storageAccounts") as Record<string, unknown>;
    const secondStorage = second.resources.find((r) => r.type === "Microsoft.Storage/storageAccounts") as Record<string, unknown>;
    expect(firstStorage.name).not.toBe(secondStorage.name);
  });

  it("throws InvalidDeploymentConfigError when Foundry config is missing", () => {
    expect(() =>
      buildArmTemplate(
        templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
        { tenantId: TENANT_ID }
      )
    ).toThrow(/Foundry API key\/resource name\/model deployment name not configured/);
  });
});

// ---------------------------------------------------------------------------
// Custom mode — Logic App
// ---------------------------------------------------------------------------

describe("buildArmTemplate — custom mode", () => {
  it("builds Logic App from custom payload", () => {
    const t = buildArmTemplate(customPayload("Microsoft.Logic/workflows", "my-workflow"), { tenantId: TENANT_ID });
    expect(t.resources).toHaveLength(1);
    expect(t.resources[0].type).toBe("Microsoft.Logic/workflows");
  });

  it("builds Service Bus namespace from custom payload", () => {
    const t = buildArmTemplate(customPayload("Microsoft.ServiceBus/namespaces", "my-queue"), { tenantId: TENANT_ID });
    expect(t.resources).toHaveLength(1);
    expect(t.resources[0].type).toBe("Microsoft.ServiceBus/namespaces");
  });

  it("builds Event Grid topic from custom payload", () => {
    const t = buildArmTemplate(customPayload("Microsoft.EventGrid/topics", "my-topic"), { tenantId: TENANT_ID });
    expect(t.resources).toHaveLength(1);
    expect(t.resources[0].type).toBe("Microsoft.EventGrid/topics");
  });

  it("unknown custom resource type throws", () => {
    expect(() =>
      buildArmTemplate(customPayload("Microsoft.Unknown/resource", "thing"), { tenantId: TENANT_ID })
    ).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Custom mode — name resolution
// ---------------------------------------------------------------------------

describe("buildArmTemplate — custom mode name resolution", () => {
  it("uses config.workflowName over catalog name for Logic App", () => {
    const t = buildArmTemplate(
      customPayload("Microsoft.Logic/workflows", "CatalogName", { workflowName: "my-real-wf" }),
      { tenantId: TENANT_ID }
    );
    expect(t.resources[0].name).toBe("my-real-wf");
  });

  it("falls back to catalog name when config.workflowName is missing", () => {
    const t = buildArmTemplate(
      customPayload("Microsoft.Logic/workflows", "fallback-wf", {}),
      { tenantId: TENANT_ID }
    );
    expect(t.resources[0].name).toBe("fallback-wf");
  });
});
