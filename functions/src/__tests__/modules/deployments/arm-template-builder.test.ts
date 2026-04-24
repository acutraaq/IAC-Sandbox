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
    const t = buildArmTemplate(templatePayload("storage-account", { storageName: "mystore" }), { tenantId: TENANT_ID });
    expect(t.$schema).toBe("https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#");
    expect(t.contentVersion).toBe("1.0.0.0");
  });

  it("parameters and outputs are empty objects", () => {
    const t = buildArmTemplate(templatePayload("storage-account"), { tenantId: TENANT_ID });
    expect(t.parameters).toEqual({});
    expect(t.outputs).toEqual({});
  });

  it("applies tags to every resource when opts.tags provided", () => {
    const t = buildArmTemplate(templatePayload("storage-account", { storageName: "tagtest" }), { tenantId: TENANT_ID, tags: TAGS });
    for (const r of t.resources) {
      expect(r.tags).toEqual(TAGS);
    }
  });

  it("does not add tags when opts.tags omitted", () => {
    const t = buildArmTemplate(templatePayload("storage-account"), { tenantId: TENANT_ID });
    for (const r of t.resources) {
      expect(r.tags).toBeUndefined();
    }
  });

  it("unknown template slug throws", () => {
    expect(() => buildArmTemplate(templatePayload("unknown-slug"), { tenantId: TENANT_ID })).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Storage Account builder
// ---------------------------------------------------------------------------

describe("buildStorageAccount", () => {
  it("happy path: correct type and apiVersion", () => {
    const t = buildArmTemplate(templatePayload("storage-account", { storageName: "mystore" }), { tenantId: TENANT_ID });
    const r = t.resources[0];
    expect(r.type).toBe("Microsoft.Storage/storageAccounts");
    expect(r.apiVersion).toBe("2023-01-01");
  });

  it("sanitizes name — strips special chars, lowercase, max 24", () => {
    const t = buildArmTemplate(templatePayload("storage-account", { storageName: "My_Storage-Account!@#" }), { tenantId: TENANT_ID });
    expect(t.resources[0].name).toMatch(/^[a-z0-9]{1,24}$/);
    expect(t.resources[0].name.length).toBeLessThanOrEqual(24);
  });

  it("uses fallback name when sanitized result is empty", () => {
    const t = buildArmTemplate(templatePayload("storage-account", { storageName: "---" }), { tenantId: TENANT_ID });
    expect(t.resources[0].name).toBe("sandboxstorage");
  });

  it("maps short redundancy code to full SKU name", () => {
    const t = buildArmTemplate(templatePayload("storage-account", { storageName: "s", redundancy: "GRS" }), { tenantId: TENANT_ID });
    expect((t.resources[0] as Record<string, unknown>).sku).toEqual({ name: "Standard_GRS" });
  });
});

// ---------------------------------------------------------------------------
// Virtual Network builder
// ---------------------------------------------------------------------------

describe("buildVirtualNetwork", () => {
  it("happy path: correct type and apiVersion", () => {
    const t = buildArmTemplate(templatePayload("virtual-network", { vnetName: "my-vnet" }), { tenantId: TENANT_ID });
    const r = t.resources[0];
    expect(r.type).toBe("Microsoft.Network/virtualNetworks");
    expect(r.apiVersion).toBe("2023-09-01");
  });

  it("sanitizes name — replaces non-alphanum with hyphens, max 64", () => {
    const longName = "a".repeat(80);
    const t = buildArmTemplate(templatePayload("virtual-network", { vnetName: longName }), { tenantId: TENANT_ID });
    expect(t.resources[0].name.length).toBeLessThanOrEqual(64);
  });

  it("uses custom address space from formValues", () => {
    const t = buildArmTemplate(templatePayload("virtual-network", { vnetName: "v", addressSpace: "192.168.0.0/24" }), { tenantId: TENANT_ID });
    const props = (t.resources[0] as Record<string, unknown>).properties as { addressSpace: { addressPrefixes: string[] } };
    expect(props.addressSpace.addressPrefixes).toContain("192.168.0.0/24");
  });
});

// ---------------------------------------------------------------------------
// Key Vault builder
// ---------------------------------------------------------------------------

describe("buildKeyVault", () => {
  it("happy path: correct type and apiVersion", () => {
    const t = buildArmTemplate(templatePayload("key-vault", { vaultName: "my-kv" }), { tenantId: TENANT_ID });
    const r = t.resources[0];
    expect(r.type).toBe("Microsoft.KeyVault/vaults");
    expect(r.apiVersion).toBe("2023-07-01");
  });

  it("name starts with a letter after sanitization", () => {
    const t = buildArmTemplate(templatePayload("key-vault", { vaultName: "123vault" }), { tenantId: TENANT_ID });
    expect(t.resources[0].name).toMatch(/^[a-z]/);
  });

  it("name max 24 chars", () => {
    const t = buildArmTemplate(templatePayload("key-vault", { vaultName: "a".repeat(40) }), { tenantId: TENANT_ID });
    expect(t.resources[0].name.length).toBeLessThanOrEqual(24);
  });

  it("uses fallback name when sanitized result is empty", () => {
    const t = buildArmTemplate(templatePayload("key-vault", { vaultName: "123" }), { tenantId: TENANT_ID });
    expect(t.resources[0].name).toBe("sandbox-kv");
  });

  it("sets tenantId from opts", () => {
    const t = buildArmTemplate(templatePayload("key-vault", { vaultName: "kv" }), { tenantId: "my-tenant" });
    const props = (t.resources[0] as Record<string, unknown>).properties as { tenantId: string };
    expect(props.tenantId).toBe("my-tenant");
  });
});

// ---------------------------------------------------------------------------
// PostgreSQL builder
// ---------------------------------------------------------------------------

describe("buildPostgresServer", () => {
  it("happy path: correct type and apiVersion", () => {
    const t = buildArmTemplate(templatePayload("database", { dbName: "mydb" }), { tenantId: TENANT_ID });
    const r = t.resources[0];
    expect(r.type).toBe("Microsoft.DBforPostgreSQL/flexibleServers");
    expect(r.apiVersion).toBe("2023-12-01");
  });

  it("sanitizes name, max 63 chars", () => {
    const t = buildArmTemplate(templatePayload("database", { dbName: "a".repeat(80) }), { tenantId: TENANT_ID });
    expect(t.resources[0].name.length).toBeLessThanOrEqual(63);
  });

  it("uses fallback name when input sanitizes to empty", () => {
    const t = buildArmTemplate(templatePayload("database", { dbName: "---" }), { tenantId: TENANT_ID });
    expect(t.resources[0].name).toBe("sandbox-db");
  });
});

// ---------------------------------------------------------------------------
// Web Application builder (2 resources: serverfarms + sites)
// ---------------------------------------------------------------------------

describe("buildWebApplication", () => {
  it("returns 2 resources: serverfarm and site", () => {
    const t = buildArmTemplate(templatePayload("web-application", { appName: "myapp" }), { tenantId: TENANT_ID });
    expect(t.resources).toHaveLength(2);
    expect(t.resources[0].type).toBe("Microsoft.Web/serverfarms");
    expect(t.resources[1].type).toBe("Microsoft.Web/sites");
  });

  it("sanitizes name, max 60 chars", () => {
    const t = buildArmTemplate(templatePayload("web-application", { appName: "a".repeat(80) }), { tenantId: TENANT_ID });
    expect(t.resources[1].name.length).toBeLessThanOrEqual(60);
  });

  it("falls back to B1 for invalid planSize", () => {
    const t = buildArmTemplate(templatePayload("web-application", { appName: "app", planSize: "P3" }), { tenantId: TENANT_ID });
    const sku = (t.resources[0] as Record<string, unknown>).sku as { name: string };
    expect(sku.name).toBe("B1");
  });

  it("accepts valid planSize B2", () => {
    const t = buildArmTemplate(templatePayload("web-application", { appName: "app", planSize: "B2" }), { tenantId: TENANT_ID });
    const sku = (t.resources[0] as Record<string, unknown>).sku as { name: string };
    expect(sku.name).toBe("B2");
  });
});

// ---------------------------------------------------------------------------
// Container App builder (2 resources: managedEnvironments + containerApps)
// ---------------------------------------------------------------------------

describe("buildContainerApp", () => {
  it("returns 2 resources: managedEnvironment and containerApp", () => {
    const t = buildArmTemplate(templatePayload("container-app", { appName: "myapp" }), { tenantId: TENANT_ID });
    expect(t.resources).toHaveLength(2);
    expect(t.resources[0].type).toBe("Microsoft.App/managedEnvironments");
    expect(t.resources[1].type).toBe("Microsoft.App/containerApps");
  });

  it("sanitizes name, max 32 chars", () => {
    const t = buildArmTemplate(templatePayload("container-app", { appName: "a".repeat(50) }), { tenantId: TENANT_ID });
    expect(t.resources[1].name.length).toBeLessThanOrEqual(32);
  });

  it("uses custom container image when provided", () => {
    const t = buildArmTemplate(templatePayload("container-app", { appName: "app", containerImage: "myrepo/myimage:v1" }), { tenantId: TENANT_ID });
    const props = (t.resources[1] as Record<string, unknown>).properties as { template: { containers: Array<{ image: string }> } };
    expect(props.template.containers[0].image).toBe("myrepo/myimage:v1");
  });
});

// ---------------------------------------------------------------------------
// Virtual Machine builder (4 resources)
// ---------------------------------------------------------------------------

describe("buildVirtualMachine (custom mode)", () => {
  // The `virtual-machine` template slug is blocked by subscription policy
  // (see POLICY_BLOCKED_TEMPLATE_SLUGS). The custom-mode builder for the
  // underlying Microsoft.Compute/virtualMachines resource type is still
  // reachable — exercise it here.
  it("returns 4 resources: publicIP, vnet, nic, vm", () => {
    const t = buildArmTemplate(
      customPayload("Microsoft.Compute/virtualMachines", "myvm"),
      { tenantId: TENANT_ID }
    );
    expect(t.resources).toHaveLength(4);
    expect(t.resources[0].type).toBe("Microsoft.Network/publicIPAddresses");
    expect(t.resources[1].type).toBe("Microsoft.Network/virtualNetworks");
    expect(t.resources[2].type).toBe("Microsoft.Network/networkInterfaces");
    expect(t.resources[3].type).toBe("Microsoft.Compute/virtualMachines");
  });

  it("sanitizes name, max 15 chars", () => {
    const t = buildArmTemplate(
      customPayload("Microsoft.Compute/virtualMachines", "a".repeat(30)),
      { tenantId: TENANT_ID }
    );
    expect(t.resources[3].name.length).toBeLessThanOrEqual(15);
  });

  it("uses fallback name when sanitized result is empty", () => {
    const t = buildArmTemplate(
      customPayload("Microsoft.Compute/virtualMachines", "---"),
      { tenantId: TENANT_ID }
    );
    expect(t.resources[3].name).toBe("sandbox-vm");
  });
});

describe("policy-blocked template slugs", () => {
  it("throws PolicyBlockedTemplateError for virtual-machine slug", () => {
    expect(() =>
      buildArmTemplate(templatePayload("virtual-machine", { vmName: "x" }), { tenantId: TENANT_ID })
    ).toThrow(/blocked by subscription policy/);
  });

  it.each([
    "full-stack-web-app",
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
// Landing Zone builder (conditional resources)
// ---------------------------------------------------------------------------

describe("buildLandingZone", () => {
  it("returns only monitoring workspace when only includeMonitoring is true", () => {
    const t = buildArmTemplate(
      templatePayload("landing-zone", { includeMonitoring: true, namingPrefix: "proj" }),
      { tenantId: TENANT_ID }
    );
    expect(t.resources).toHaveLength(1);
    expect(t.resources[0].type).toBe("Microsoft.OperationalInsights/workspaces");
  });

  it("returns vnet + kv + workspace when all flags true", () => {
    const t = buildArmTemplate(
      templatePayload("landing-zone", { includeNetwork: true, includeSecurity: true, includeMonitoring: true, namingPrefix: "p" }),
      { tenantId: TENANT_ID }
    );
    const types = t.resources.map(r => r.type);
    expect(types).toContain("Microsoft.Network/virtualNetworks");
    expect(types).toContain("Microsoft.KeyVault/vaults");
    expect(types).toContain("Microsoft.OperationalInsights/workspaces");
    expect(t.resources).toHaveLength(3);
  });

  it("returns empty resources when no flags set", () => {
    const t = buildArmTemplate(templatePayload("landing-zone", {}), { tenantId: TENANT_ID });
    expect(t.resources).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// validateTemplateAgainstPolicy
// ---------------------------------------------------------------------------

describe("validateTemplateAgainstPolicy", () => {
  it("returns empty array for all-allowed template", () => {
    const t = buildArmTemplate(templatePayload("storage-account", { storageName: "s" }), { tenantId: TENANT_ID });
    expect(validateTemplateAgainstPolicy(t)).toEqual([]);
  });

  it("returns blocked type when resource is not in policy set", () => {
    const t = buildArmTemplate(
      customPayload("Microsoft.Web/sites", "app"),
      { tenantId: TENANT_ID }
    );
    // inject a non-allowed type to test the validator
    t.resources.push({ type: "Microsoft.SomeBlockedService/things", apiVersion: "2023-01-01", name: "x", location: "eastus" });
    const blocked = validateTemplateAgainstPolicy(t);
    expect(blocked).toContain("Microsoft.SomeBlockedService/things");
    expect(blocked).not.toContain("Microsoft.Web/sites");
  });
});

// ---------------------------------------------------------------------------
// Custom mode
// ---------------------------------------------------------------------------

describe("buildArmTemplate — custom mode", () => {
  it("builds storage account from custom payload", () => {
    const t = buildArmTemplate(customPayload("Microsoft.Storage/storageAccounts", "mystore"), { tenantId: TENANT_ID });
    expect(t.resources[0].type).toBe("Microsoft.Storage/storageAccounts");
  });

  it("unknown custom resource type throws", () => {
    expect(() =>
      buildArmTemplate(customPayload("Microsoft.Unknown/resource", "thing"), { tenantId: TENANT_ID })
    ).toThrow();
  });
});
