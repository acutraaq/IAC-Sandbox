import { describe, it, expect } from "vitest";
import { buildArmTemplate } from "./arm-template-builder.js";

const TENANT_ID = "test-tenant-id";
const opts = { tenantId: TENANT_ID };

function resourceTypes(payload: Parameters<typeof buildArmTemplate>[0]): string[] {
  return buildArmTemplate(payload, opts).resources.map((r) => r.type as string);
}

describe("buildArmTemplate — schema", () => {
  it("returns valid ARM schema envelope", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "storage-account", formValues: { storageName: "myfiles", region: "southeastasia", redundancy: "LRS", accessTier: "Hot" } } },
      opts
    );
    expect(result.$schema).toBe(
      "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#"
    );
    expect(result.contentVersion).toBe("1.0.0.0");
    expect(result.parameters).toEqual({});
    expect(Array.isArray(result.resources)).toBe(true);
  });
});

describe("buildArmTemplate — storage-account template", () => {
  it("creates a storage account resource", () => {
    expect(
      resourceTypes({ mode: "template", template: { slug: "storage-account", formValues: { storageName: "myfiles", region: "southeastasia", redundancy: "LRS", accessTier: "Hot" } } })
    ).toEqual(["Microsoft.Storage/storageAccounts"]);
  });

  it("uses the storageName as the resource name (lowercase alphanumeric)", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "storage-account", formValues: { storageName: "MyFiles", region: "southeastasia", redundancy: "LRS", accessTier: "Hot" } } },
      opts
    );
    expect((result.resources[0].name as string)).toBe("myfiles");
  });

  it("sets the SKU from redundancy field", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "storage-account", formValues: { storageName: "myfiles", region: "southeastasia", redundancy: "GRS", accessTier: "Hot" } } },
      opts
    );
    expect((result.resources[0] as unknown as { sku: { name: string } }).sku.name).toBe("GRS");
  });
});

describe("buildArmTemplate — virtual-network template", () => {
  it("creates a virtual network resource", () => {
    expect(
      resourceTypes({ mode: "template", template: { slug: "virtual-network", formValues: { vnetName: "my-vnet", region: "southeastasia", addressSpace: "10.0.0.0/16", subnetName: "default", subnetRange: "10.0.1.0/24" } } })
    ).toEqual(["Microsoft.Network/virtualNetworks"]);
  });

  it("sets addressSpace from formValues", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "virtual-network", formValues: { vnetName: "my-vnet", region: "southeastasia", addressSpace: "192.168.0.0/16", subnetName: "default", subnetRange: "192.168.1.0/24" } } },
      opts
    );
    const props = (result.resources[0] as unknown as { properties: { addressSpace: { addressPrefixes: string[] } } }).properties;
    expect(props.addressSpace.addressPrefixes).toEqual(["192.168.0.0/16"]);
  });
});

describe("buildArmTemplate — key-vault template", () => {
  it("creates a key vault resource", () => {
    expect(
      resourceTypes({ mode: "template", template: { slug: "key-vault", formValues: { vaultName: "my-secrets", region: "southeastasia", softDelete: true, purgeProtection: false, accessModel: "rbac" } } })
    ).toEqual(["Microsoft.KeyVault/vaults"]);
  });

  it("sets tenantId from opts", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "key-vault", formValues: { vaultName: "my-secrets", region: "southeastasia", softDelete: true, purgeProtection: false, accessModel: "rbac" } } },
      opts
    );
    expect((result.resources[0] as unknown as { properties: { tenantId: string } }).properties.tenantId).toBe(TENANT_ID);
  });
});

describe("buildArmTemplate — database template", () => {
  it("creates a PostgreSQL flexible server", () => {
    expect(
      resourceTypes({ mode: "template", template: { slug: "database", formValues: { dbName: "my-db", region: "southeastasia", engineVersion: "16", storageGB: 32, enableBackup: true, enableFirewall: false } } })
    ).toEqual(["Microsoft.DBforPostgreSQL/flexibleServers"]);
  });

  it("sets the PostgreSQL version from formValues", () => {
    const result = buildArmTemplate(
      { mode: "template", template: { slug: "database", formValues: { dbName: "my-db", region: "southeastasia", engineVersion: "15", storageGB: 32, enableBackup: true, enableFirewall: false } } },
      opts
    );
    expect((result.resources[0] as unknown as { properties: { version: string } }).properties.version).toBe("15");
  });
});

describe("buildArmTemplate — custom mode", () => {
  it("maps Microsoft.Storage/storageAccounts to a storage account resource", () => {
    expect(
      resourceTypes({
        mode: "custom",
        resources: [{ type: "Microsoft.Storage/storageAccounts", name: "mystore", icon: "HardDrive", config: { region: "southeastasia", redundancy: "LRS", accessTier: "Hot" } }],
      })
    ).toEqual(["Microsoft.Storage/storageAccounts"]);
  });

  it("maps Microsoft.KeyVault/vaults to a key vault resource", () => {
    expect(
      resourceTypes({
        mode: "custom",
        resources: [{ type: "Microsoft.KeyVault/vaults", name: "my-vault", icon: "KeyRound", config: { region: "southeastasia", softDelete: true, purgeProtection: false, accessModel: "rbac" } }],
      })
    ).toEqual(["Microsoft.KeyVault/vaults"]);
  });

  it("maps Microsoft.Network/virtualNetworks to a VNet resource", () => {
    expect(
      resourceTypes({
        mode: "custom",
        resources: [{ type: "Microsoft.Network/virtualNetworks", name: "my-net", icon: "Network", config: { region: "southeastasia", addressSpace: "10.0.0.0/16" } }],
      })
    ).toEqual(["Microsoft.Network/virtualNetworks"]);
  });

  it("maps Microsoft.Network/networkSecurityGroups to an NSG resource", () => {
    expect(
      resourceTypes({
        mode: "custom",
        resources: [{ type: "Microsoft.Network/networkSecurityGroups", name: "my-nsg", icon: "Shield", config: { region: "southeastasia", allowHTTPS: true } }],
      })
    ).toEqual(["Microsoft.Network/networkSecurityGroups"]);
  });

  it("combines multiple resource types into one resources array", () => {
    const types = resourceTypes({
      mode: "custom",
      resources: [
        { type: "Microsoft.Storage/storageAccounts", name: "mystore", icon: "HardDrive", config: { region: "southeastasia", redundancy: "LRS", accessTier: "Hot" } },
        { type: "Microsoft.KeyVault/vaults", name: "my-vault", icon: "KeyRound", config: { region: "southeastasia", softDelete: true, purgeProtection: false, accessModel: "rbac" } },
      ],
    });
    expect(types).toContain("Microsoft.Storage/storageAccounts");
    expect(types).toContain("Microsoft.KeyVault/vaults");
  });
});

describe("buildArmTemplate — web-application template", () => {
  it("creates App Service Plan and Web App", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "web-application", formValues: { appName: "my-app", region: "southeastasia", planSize: "B1", httpsOnly: true } },
    });
    expect(types).toContain("Microsoft.Web/serverfarms");
    expect(types).toContain("Microsoft.Web/sites");
  });
});

describe("buildArmTemplate — container-app template", () => {
  it("creates Managed Environment and Container App", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "container-app", formValues: { appName: "my-app", region: "southeastasia", containerImage: "nginx:latest", minReplicas: 1, maxReplicas: 3, externalAccess: true } },
    });
    expect(types).toContain("Microsoft.App/managedEnvironments");
    expect(types).toContain("Microsoft.App/containerApps");
  });
});

describe("buildArmTemplate — virtual-machine template", () => {
  it("creates Public IP, VNet, NIC, and VM", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "virtual-machine", formValues: { vmName: "my-vm", region: "southeastasia", osType: "Ubuntu2204", vmSize: "Standard_B2s", adminUsername: "azureuser", enableSSH: true } },
    });
    expect(types).toContain("Microsoft.Network/publicIPAddresses");
    expect(types).toContain("Microsoft.Network/virtualNetworks");
    expect(types).toContain("Microsoft.Network/networkInterfaces");
    expect(types).toContain("Microsoft.Compute/virtualMachines");
  });
});

describe("buildArmTemplate — landing-zone template", () => {
  it("always includes NSG", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "landing-zone", formValues: { projectName: "myproj", region: "southeastasia", namingPrefix: "proj", includeNetwork: false, includeMonitoring: false, includeSecurity: false } },
    });
    expect(types).toContain("Microsoft.Network/networkSecurityGroups");
  });

  it("includes VNet when includeNetwork is true", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "landing-zone", formValues: { projectName: "myproj", region: "southeastasia", namingPrefix: "proj", includeNetwork: true, includeMonitoring: false, includeSecurity: false } },
    });
    expect(types).toContain("Microsoft.Network/virtualNetworks");
  });

  it("includes Key Vault when includeSecurity is true", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "landing-zone", formValues: { projectName: "myproj", region: "southeastasia", namingPrefix: "proj", includeNetwork: false, includeMonitoring: false, includeSecurity: true } },
    });
    expect(types).toContain("Microsoft.KeyVault/vaults");
  });

  it("includes Log Analytics when includeMonitoring is true", () => {
    const types = resourceTypes({
      mode: "template",
      template: { slug: "landing-zone", formValues: { projectName: "myproj", region: "southeastasia", namingPrefix: "proj", includeNetwork: false, includeMonitoring: true, includeSecurity: false } },
    });
    expect(types).toContain("Microsoft.OperationalInsights/workspaces");
  });
});

describe("buildArmTemplate — custom mode multi-resource", () => {
  it("maps Microsoft.Web/sites to App Service Plan + Web App", () => {
    const types = resourceTypes({
      mode: "custom",
      resources: [{ type: "Microsoft.Web/sites", name: "my-app", icon: "Globe", config: { region: "southeastasia", planSize: "B1" } }],
    });
    expect(types).toContain("Microsoft.Web/serverfarms");
    expect(types).toContain("Microsoft.Web/sites");
  });

  it("maps Microsoft.Compute/virtualMachines to 4 VM resources", () => {
    const types = resourceTypes({
      mode: "custom",
      resources: [{ type: "Microsoft.Compute/virtualMachines", name: "my-vm", icon: "Monitor", config: { region: "southeastasia", vmSize: "Standard_B2s", osType: "Ubuntu2204", adminUsername: "azureuser" } }],
    });
    expect(types).toContain("Microsoft.Network/publicIPAddresses");
    expect(types).toContain("Microsoft.Compute/virtualMachines");
  });

  it("maps Microsoft.App/containerApps to environment + app", () => {
    const types = resourceTypes({
      mode: "custom",
      resources: [{ type: "Microsoft.App/containerApps", name: "my-app", icon: "Box", config: { region: "southeastasia", containerImage: "nginx:latest" } }],
    });
    expect(types).toContain("Microsoft.App/managedEnvironments");
    expect(types).toContain("Microsoft.App/containerApps");
  });
});
