import { describe, it, expect } from "vitest";
import { buildArmTemplate, validateTemplateAgainstPolicy } from "../../../modules/deployments/arm-template-builder.js";
import type { DeploymentPayload } from "../../../modules/deployments/deployment.schema.js";

const TENANT_ID = "test-tenant-id";
const TAGS = { "Cost Center": "CC01", "Project ID": "PID01", "Project Owner": "owner@test.com", "Expiry Date": "2025-12-31" };

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
