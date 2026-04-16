import type { DeploymentPayload } from "./deployment.schema.js";

// ---------------------------------------------------------------------------
// Subscription policy: COE-Allowed-Resources
// Deny effect — any resource type NOT in this list will be rejected by Azure.
// ---------------------------------------------------------------------------

export const POLICY_ALLOWED_RESOURCE_TYPES = new Set([
  "Microsoft.Compute/virtualMachines",
  "Microsoft.Compute/virtualMachines/extensions",
  "Microsoft.ContainerInstance/containerGroups",
  "Microsoft.ContainerService/managedClusters",
  "Microsoft.App/managedEnvironments",
  "Microsoft.App/containerApps",
  "Microsoft.Web/serverfarms",
  "Microsoft.Web/sites",
  "Microsoft.Web/staticSites",
  "Microsoft.Network/virtualNetworks",
  "Microsoft.Network/virtualNetworks/subnets",
  "Microsoft.Network/privateEndpoints",
  "Microsoft.Network/publicIPAddresses",
  "Microsoft.Network/applicationGateways",
  "Microsoft.Storage/storageAccounts",
  "Microsoft.Sql/servers",
  "Microsoft.Sql/servers/databases",
  "Microsoft.DocumentDB/databaseAccounts",
  "Microsoft.DBforPostgreSQL/flexibleServers",
  "Microsoft.DBforMySQL/flexibleServers",
  "Microsoft.Synapse/workspaces",
  "Microsoft.KeyVault/vaults",
  "Microsoft.ManagedIdentity/userAssignedIdentities",
  "Microsoft.EventGrid/topics",
  "Microsoft.ServiceBus/namespaces",
  "Microsoft.EventHub/namespaces",
  "Microsoft.OperationalInsights/workspaces",
  "Microsoft.ApiManagement/service",
  "Microsoft.Logic/workflows",
]);

/**
 * Returns the list of resource types in the template that are blocked by the
 * COE-Allowed-Resources policy. An empty array means the template is clean.
 */
export function validateTemplateAgainstPolicy(template: ArmTemplate): string[] {
  return template.resources
    .map((r) => r.type)
    .filter((type) => !POLICY_ALLOWED_RESOURCE_TYPES.has(type));
}

export interface ArmResource {
  type: string;
  apiVersion: string;
  name: string;
  location: string;
  [key: string]: unknown;
}

export interface ArmTemplate {
  $schema: string;
  contentVersion: string;
  parameters: Record<string, unknown>;
  resources: ArmResource[];
  outputs: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Azure storage SKU names require the "Standard_" or "Premium_" prefix.
// The frontend sends short forms ("LRS", "GRS", etc.) — map them here.
const STORAGE_SKU_MAP: Record<string, string> = {
  LRS: "Standard_LRS",
  GRS: "Standard_GRS",
  ZRS: "Standard_ZRS",
  RAGRS: "Standard_RAGRS",
  GZRS: "Standard_GZRS",
  RAGZRS: "Standard_RAGZRS",
};

function toStorageSku(value: string): string {
  return STORAGE_SKU_MAP[value.toUpperCase()] ?? value;
}

// ---------------------------------------------------------------------------
// Single-resource builders
// ---------------------------------------------------------------------------

function buildStorageAccount(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource {
  // Storage account names: 3-24 chars, lowercase letters and numbers only
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24) || "sandboxstorage";

  return {
    type: "Microsoft.Storage/storageAccounts",
    apiVersion: "2023-01-01",
    name: safeName,
    location,
    sku: { name: toStorageSku(typeof config.redundancy === "string" ? config.redundancy : "LRS") },
    kind: "StorageV2",
    properties: {
      accessTier: typeof config.accessTier === "string" ? config.accessTier : "Hot",
      allowBlobPublicAccess: config.publicAccess === true,
    },
  };
}

function buildVirtualNetwork(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource {
  const addressSpace =
    typeof config.addressSpace === "string" ? config.addressSpace : "10.0.0.0/16";
  const subnetName =
    typeof config.subnetName === "string" ? config.subnetName : "default";
  const subnetRange =
    typeof config.subnetRange === "string" ? config.subnetRange : "10.0.1.0/24";

  return {
    type: "Microsoft.Network/virtualNetworks",
    apiVersion: "2023-09-01",
    name,
    location,
    properties: {
      addressSpace: { addressPrefixes: [addressSpace] },
      subnets: [{ name: subnetName, properties: { addressPrefix: subnetRange } }],
    },
  };
}

function buildKeyVault(
  name: string,
  location: string,
  config: Record<string, unknown>,
  tenantId: string
): ArmResource {
  // Key Vault names: 3-24 chars, alphanumeric and hyphens
  const safeName = name.slice(0, 24);

  return {
    type: "Microsoft.KeyVault/vaults",
    apiVersion: "2023-07-01",
    name: safeName,
    location,
    properties: {
      sku: { family: "A", name: "standard" },
      tenantId,
      enableSoftDelete: config.softDelete !== false,
      enablePurgeProtection: config.purgeProtection === true,
      enableRbacAuthorization: config.accessModel === "rbac",
      accessPolicies: [],
    },
  };
}

function buildPostgresServer(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource {
  // PostgreSQL server names: 3-63 chars, lowercase letters, digits, hyphens
  const safeName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63) || "sandbox-db";

  const storageSizeGB =
    typeof config.storageGB === "number" ? config.storageGB : 32;

  return {
    type: "Microsoft.DBforPostgreSQL/flexibleServers",
    apiVersion: "2023-12-01",
    name: safeName,
    location,
    sku: { name: "Standard_B1ms", tier: "Burstable" },
    properties: {
      version: typeof config.engineVersion === "string" ? config.engineVersion : "16",
      storage: { storageSizeGB },
      backup: {
        backupRetentionDays: config.enableBackup !== false ? 7 : 1,
        geoRedundantBackup: "Disabled",
      },
      // Default credentials for sandbox deployments — change after provisioning
      administratorLogin: "sandboxadmin",
      administratorLoginPassword: "Sandbox@Azure#1234!",
      highAvailability: { mode: "Disabled" },
    },
  };
}

// ---------------------------------------------------------------------------
// Multi-resource builders
// ---------------------------------------------------------------------------

function buildWebApplication(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource[] {
  const planSize = typeof config.planSize === "string" ? config.planSize : "B1";
  const planName = `${name}-plan`;

  return [
    {
      type: "Microsoft.Web/serverfarms",
      apiVersion: "2023-01-01",
      name: planName,
      location,
      sku: { name: planSize },
      kind: "app",
      properties: {},
    },
    {
      type: "Microsoft.Web/sites",
      apiVersion: "2023-01-01",
      name,
      location,
      dependsOn: [`[resourceId('Microsoft.Web/serverfarms', '${planName}')]`],
      properties: {
        serverFarmId: `[resourceId('Microsoft.Web/serverfarms', '${planName}')]`,
        httpsOnly: config.httpsOnly !== false,
      },
    },
  ];
}

function buildContainerApp(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource[] {
  const envName = `${name}-env`;

  return [
    {
      type: "Microsoft.App/managedEnvironments",
      apiVersion: "2024-03-01",
      name: envName,
      location,
      properties: { zoneRedundant: false },
    },
    {
      type: "Microsoft.App/containerApps",
      apiVersion: "2024-03-01",
      name,
      location,
      dependsOn: [
        `[resourceId('Microsoft.App/managedEnvironments', '${envName}')]`,
      ],
      properties: {
        managedEnvironmentId: `[resourceId('Microsoft.App/managedEnvironments', '${envName}')]`,
        configuration: {
          ingress: config.externalAccess === true
            ? { external: true, targetPort: 80 }
            : { external: false, targetPort: 80 },
        },
        template: {
          containers: [
            {
              name,
              image:
                typeof config.containerImage === "string"
                  ? config.containerImage
                  : "nginx:latest",
              resources: { cpu: 0.5, memory: "1Gi" },
            },
          ],
          scale: {
            minReplicas:
              typeof config.minReplicas === "number" ? config.minReplicas : 1,
            maxReplicas:
              typeof config.maxReplicas === "number" ? config.maxReplicas : 3,
          },
        },
      },
    },
  ];
}

function buildVirtualMachine(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource[] {
  const vmSize =
    typeof config.vmSize === "string" ? config.vmSize : "Standard_B2s";
  const osType =
    typeof config.osType === "string" ? config.osType : "Ubuntu2204";
  const adminUsername =
    typeof config.adminUsername === "string"
      ? config.adminUsername
      : "azureuser";

  const imageReference =
    osType === "WindowsServer2022"
      ? { publisher: "MicrosoftWindowsServer", offer: "WindowsServer", sku: "2022-Datacenter", version: "latest" }
      : osType === "Ubuntu2004"
      ? { publisher: "Canonical", offer: "0001-com-ubuntu-server-focal", sku: "20_04-lts", version: "latest" }
      : { publisher: "Canonical", offer: "0001-com-ubuntu-server-jammy", sku: "22_04-lts", version: "latest" };

  const isWindows = osType === "WindowsServer2022";
  const ipName = `${name}-ip`;
  const vnetName = `${name}-vnet`;
  const nicName = `${name}-nic`;
  const computerName = name.slice(0, 15);

  return [
    {
      type: "Microsoft.Network/publicIPAddresses",
      apiVersion: "2023-09-01",
      name: ipName,
      location,
      sku: { name: "Basic" },
      properties: { publicIPAllocationMethod: "Dynamic" },
    },
    {
      type: "Microsoft.Network/virtualNetworks",
      apiVersion: "2023-09-01",
      name: vnetName,
      location,
      properties: {
        addressSpace: { addressPrefixes: ["10.0.0.0/16"] },
        subnets: [
          { name: "default", properties: { addressPrefix: "10.0.1.0/24" } },
        ],
      },
    },
    {
      type: "Microsoft.Network/networkInterfaces",
      apiVersion: "2023-09-01",
      name: nicName,
      location,
      dependsOn: [
        `[resourceId('Microsoft.Network/virtualNetworks', '${vnetName}')]`,
        `[resourceId('Microsoft.Network/publicIPAddresses', '${ipName}')]`,
      ],
      properties: {
        ipConfigurations: [
          {
            name: "ipconfig1",
            properties: {
              privateIPAllocationMethod: "Dynamic",
              subnet: {
                id: `[resourceId('Microsoft.Network/virtualNetworks/subnets', '${vnetName}', 'default')]`,
              },
              publicIPAddress: {
                id: `[resourceId('Microsoft.Network/publicIPAddresses', '${ipName}')]`,
              },
            },
          },
        ],
      },
    },
    {
      type: "Microsoft.Compute/virtualMachines",
      apiVersion: "2024-03-01",
      name,
      location,
      dependsOn: [
        `[resourceId('Microsoft.Network/networkInterfaces', '${nicName}')]`,
      ],
      properties: {
        hardwareProfile: { vmSize },
        storageProfile: {
          imageReference,
          osDisk: {
            createOption: "FromImage",
            managedDisk: { storageAccountType: "Standard_LRS" },
          },
        },
        osProfile: {
          computerName,
          adminUsername,
          // Default password for sandbox deployments — change after provisioning
          adminPassword: "Sandbox@Azure#1234!",
          ...(isWindows
            ? { windowsConfiguration: { enableAutomaticUpdates: true } }
            : { linuxConfiguration: { disablePasswordAuthentication: false } }),
        },
        networkProfile: {
          networkInterfaces: [
            {
              id: `[resourceId('Microsoft.Network/networkInterfaces', '${nicName}')]`,
            },
          ],
        },
      },
    },
  ];
}

function buildLandingZone(
  config: Record<string, unknown>,
  location: string,
  tenantId: string
): ArmResource[] {
  const prefix =
    typeof config.namingPrefix === "string" ? config.namingPrefix : "proj";
  const resources: ArmResource[] = [];

  if (config.includeNetwork === true) {
    resources.push(
      buildVirtualNetwork(`${prefix}-vnet`, location, {
        addressSpace: "10.0.0.0/16",
        subnetName: "default",
        subnetRange: "10.0.1.0/24",
      })
    );
  }

  if (config.includeSecurity === true) {
    resources.push(
      buildKeyVault(`${prefix}-kv`, location, { softDelete: true, purgeProtection: false, accessModel: "rbac" }, tenantId)
    );
  }

  if (config.includeMonitoring === true) {
    resources.push({
      type: "Microsoft.OperationalInsights/workspaces",
      apiVersion: "2023-09-01",
      name: `${prefix}-law`,
      location,
      properties: {
        retentionInDays: 30,
        sku: { name: "PerGB2018" },
      },
    });
  }

  return resources;
}

// ---------------------------------------------------------------------------
// Template-mode dispatcher
// ---------------------------------------------------------------------------

function buildTemplateResources(
  template: { slug: string; formValues: Record<string, unknown> },
  tenantId: string
): ArmResource[] {
  const { slug, formValues } = template;
  const location =
    typeof formValues.region === "string" ? formValues.region : "southeastasia";

  switch (slug) {
    case "web-application":
      return buildWebApplication(
        typeof formValues.appName === "string" ? formValues.appName : "sandbox-app",
        location,
        formValues
      );
    case "virtual-machine":
      return buildVirtualMachine(
        typeof formValues.vmName === "string" ? formValues.vmName : "sandbox-vm",
        location,
        formValues
      );
    case "database":
      return [
        buildPostgresServer(
          typeof formValues.dbName === "string" ? formValues.dbName : "sandbox-db",
          location,
          formValues
        ),
      ];
    case "storage-account":
      return [
        buildStorageAccount(
          typeof formValues.storageName === "string" ? formValues.storageName : "sandboxstorage",
          location,
          formValues
        ),
      ];
    case "virtual-network":
      return [
        buildVirtualNetwork(
          typeof formValues.vnetName === "string" ? formValues.vnetName : "sandbox-vnet",
          location,
          formValues
        ),
      ];
    case "key-vault":
      return [
        buildKeyVault(
          typeof formValues.vaultName === "string" ? formValues.vaultName : "sandbox-kv",
          location,
          formValues,
          tenantId
        ),
      ];
    case "container-app":
      return buildContainerApp(
        typeof formValues.appName === "string" ? formValues.appName : "sandbox-app",
        location,
        formValues
      );
    case "landing-zone":
      return buildLandingZone(formValues, location, tenantId);
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Custom-mode dispatcher
// ---------------------------------------------------------------------------

function buildCustomResources(
  resources: Array<{
    type: string;
    name: string;
    icon: string;
    config: Record<string, unknown>;
  }>,
  tenantId: string
): ArmResource[] {
  const armResources: ArmResource[] = [];

  for (const resource of resources) {
    const location =
      typeof resource.config.region === "string"
        ? resource.config.region
        : "southeastasia";

    switch (resource.type) {
      case "Microsoft.Web/sites":
        armResources.push(...buildWebApplication(resource.name, location, resource.config));
        break;
      case "Microsoft.Compute/virtualMachines":
        armResources.push(...buildVirtualMachine(resource.name, location, resource.config));
        break;
      case "Microsoft.DBforPostgreSQL/flexibleServers":
        armResources.push(buildPostgresServer(resource.name, location, resource.config));
        break;
      case "Microsoft.Storage/storageAccounts":
        armResources.push(buildStorageAccount(resource.name, location, resource.config));
        break;
      case "Microsoft.Network/virtualNetworks":
        armResources.push(buildVirtualNetwork(resource.name, location, resource.config));
        break;
      case "Microsoft.KeyVault/vaults":
        armResources.push(buildKeyVault(resource.name, location, resource.config, tenantId));
        break;
      case "Microsoft.App/containerApps":
        armResources.push(...buildContainerApp(resource.name, location, resource.config));
        break;
    }
  }

  return armResources;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildArmTemplate(
  payload: DeploymentPayload,
  opts: { tenantId: string }
): ArmTemplate {
  const resources =
    payload.mode === "template"
      ? buildTemplateResources(payload.template, opts.tenantId)
      : buildCustomResources(payload.resources, opts.tenantId);

  return {
    $schema:
      "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    contentVersion: "1.0.0.0",
    parameters: {},
    resources,
    outputs: {},
  };
}
