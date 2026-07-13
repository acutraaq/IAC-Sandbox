import { randomBytes } from "crypto";
import type { DeploymentPayload } from "./deployment.schema.js";
import { sanitizeStorageName, sanitizeKeyVaultName, sanitizeGenericName } from "./sanitize.js";

const ALLOWED_REGIONS = new Set(["malaysiawest"]);
const DEFAULT_REGION = "malaysiawest";
function resolveRegion(raw: unknown): string {
  const r = typeof raw === "string" ? raw : DEFAULT_REGION;
  return ALLOWED_REGIONS.has(r) ? r : DEFAULT_REGION;
}

function generatePassword(): string {
  return randomBytes(16).toString("base64url");
}

// ---------------------------------------------------------------------------
// Shared supporting-resource builders (observability + security)
// ---------------------------------------------------------------------------
// Subscription policy: COE-Allowed-Resources
// Deny effect — any resource type NOT in this list will be rejected by Azure.
//
// This list gates the *generated* ARM resources (post-build), so it must
// include companion types a single builder call emits alongside the
// user-selected input type (Microsoft.Web/serverfarms alongside
// Microsoft.Web/sites, Microsoft.Sql/servers/databases alongside
// Microsoft.Sql/servers, Microsoft.App/managedEnvironments alongside
// Microsoft.App/containerApps). It is intentionally narrower than a generic
// subscription-wide allow-list and intentionally NOT a byte-for-byte mirror
// of web/lib/deployments/policy.ts's ALLOWED_RESOURCE_TYPES, which gates the
// *input* `resources[].type` field before any building happens — trim both
// together when adding a new builder, but expect this one to carry a few
// extra companion types.
// ---------------------------------------------------------------------------

const POLICY_ALLOWED_RESOURCE_TYPES = new Set([
  "Microsoft.Web/sites",
  "Microsoft.Web/serverfarms",
  "Microsoft.DBforPostgreSQL/flexibleServers",
  "Microsoft.Storage/storageAccounts",
  "Microsoft.Network/virtualNetworks",
  "Microsoft.KeyVault/vaults",
  "Microsoft.App/containerApps",
  "Microsoft.App/managedEnvironments",
  "Microsoft.Web/staticSites",
  "Microsoft.Logic/workflows",
  "Microsoft.ServiceBus/namespaces",
  "Microsoft.EventGrid/topics",
  "Microsoft.Sql/servers",
  "Microsoft.Sql/servers/databases",
  "Microsoft.Web/connections",
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

interface ArmResource {
  type: string;
  apiVersion: string;
  name: string;
  location?: string;
  [key: string]: unknown;
}

interface ArmTemplate {
  $schema: string;
  contentVersion: string;
  parameters: Record<string, unknown>;
  resources: ArmResource[];
  outputs: Record<string, unknown>;
  _deployParameters?: Record<string, { value: string }>;
}

// ---------------------------------------------------------------------------
// Subscription policy: Sandbox - Restrict App Service SKUs
// Only F1, B1, B2, B3 are permitted for Microsoft.Web/serverfarms.
// ---------------------------------------------------------------------------

const ALLOWED_APP_SERVICE_SKUS = new Set(["F1", "B1", "B2", "B3"]);

// ---------------------------------------------------------------------------
// Policy-blocked template slugs (source of truth: web/data/templates.json
// `policyBlocked: true`). Mirrored here so the backend rejects these with a
// clear error instead of the misleading "no builder" fallback.
// ---------------------------------------------------------------------------

export const POLICY_BLOCKED_TEMPLATE_SLUGS = new Set([
  "virtual-machine",
  "microservices-platform",
  "data-pipeline",
  "secure-api-backend",
]);

export class PolicyBlockedTemplateError extends Error {
  readonly slug: string;
  constructor(slug: string) {
    super(`Template "${slug}" is blocked by subscription policy and cannot be deployed.`);
    this.name = "PolicyBlockedTemplateError";
    this.slug = slug;
  }
}

export class InvalidDeploymentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDeploymentConfigError";
  }
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
  config: Record<string, unknown>,
  suffix = ""
): ArmResource {
  const base = sanitizeStorageName(name).slice(0, 16) || "sandboxstorage";
  const safeName = suffix ? base + suffix.slice(0, 8) : base;

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
  const safeName = sanitizeGenericName(name, 64) || "sandbox-vnet";
  const addressSpace =
    typeof config.addressSpace === "string" ? config.addressSpace : "10.0.0.0/16";
  const subnetName =
    typeof config.subnetName === "string" ? config.subnetName : "default";
  const subnetRange =
    typeof config.subnetRange === "string" ? config.subnetRange : "10.0.1.0/24";

  return {
    type: "Microsoft.Network/virtualNetworks",
    apiVersion: "2023-09-01",
    name: safeName,
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
  tenantId: string,
  suffix = ""
): ArmResource {
  const base = (sanitizeKeyVaultName(name) || "sandbox-kv").slice(0, 16).replace(/-+$/, "");
  const safeName = suffix ? base + suffix.slice(0, 8) : base;
  const rawSku = typeof config.kvSku === "string" ? config.kvSku
    : typeof config.sku === "string" ? config.sku
    : "standard";
  const kvSkuName = rawSku === "premium" ? "premium" : "standard";

  return {
    type: "Microsoft.KeyVault/vaults",
    apiVersion: "2023-07-01",
    name: safeName,
    location,
    properties: {
      sku: { family: "A", name: kvSkuName },
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
  config: Record<string, unknown>,
  deployParams: Record<string, { value: string }>
): ArmResource {
  const safeName = sanitizeGenericName(name, 63) || "sandbox-db";
  const storageSizeGB =
    typeof config.storageGB === "number" ? config.storageGB : 32;

  deployParams["pgAdminPassword"] = { value: generatePassword() };

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
      administratorLogin: "sandboxadmin",
      administratorLoginPassword: "[parameters('pgAdminPassword')]",
      highAvailability: { mode: "Disabled" },
    },
  };
}

// ---------------------------------------------------------------------------
// Azure SQL Server + database builder
// ---------------------------------------------------------------------------

function buildSqlServer(
  serverName: string,
  dbName: string,
  location: string,
  config: Record<string, unknown>,
  deployParams: Record<string, { value: string }>
): ArmResource[] {
  const safeServer = sanitizeGenericName(serverName, 63) || "sandbox-sql";
  const safeDb = sanitizeGenericName(dbName, 128) || "appdb";
  const adminUser = typeof config.adminUser === "string" && config.adminUser.length > 0
    ? config.adminUser
    : "sandboxadmin";
  const adminPassword = typeof config.adminPassword === "string" && config.adminPassword.length > 0
    ? config.adminPassword
    : generatePassword();
  const dbSku = typeof config.dbSku === "string" ? config.dbSku : "Basic";

  deployParams["sqlAdminPassword"] = { value: adminPassword };

  return [
    {
      type: "Microsoft.Sql/servers",
      apiVersion: "2021-11-01",
      name: safeServer,
      location,
      properties: {
        administratorLogin: adminUser,
        administratorLoginPassword: "[parameters('sqlAdminPassword')]",
        version: "12.0",
      },
    },
    {
      type: "Microsoft.Sql/servers/databases",
      apiVersion: "2021-11-01",
      name: `${safeServer}/${safeDb}`,
      location,
      dependsOn: [`[resourceId('Microsoft.Sql/servers', '${safeServer}')]`],
      sku: { name: dbSku },
      properties: {
        collation: "SQL_Latin1_General_CP1_CI_AS",
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Multi-resource builders
// ---------------------------------------------------------------------------

function buildWebApplication(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource[] {
  const safeName = sanitizeGenericName(name, 60) || "sandbox-app";
  const rawPlanSize = typeof config.planSize === "string" ? config.planSize : "B1";
  const planSize = ALLOWED_APP_SERVICE_SKUS.has(rawPlanSize) ? rawPlanSize : "B1";
  const planName = `${safeName}-plan`;

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
      name: safeName,
      location,
      dependsOn: [`[resourceId('Microsoft.Web/serverfarms', '${planName}')]`],
      properties: {
        serverFarmId: `[resourceId('Microsoft.Web/serverfarms', '${planName}')]`,
        httpsOnly: config.httpsOnly !== false,
        siteConfig: {
          minTlsVersion: "1.2",
          ftpsState: "Disabled",
        },
      },
    },
  ];
}

function buildContainerApp(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource[] {
  const safeName = sanitizeGenericName(name, 32) || "sandbox-app";
  const envName = `${safeName}-env`;
  const minReplicas = typeof config.minReplicas === "number" ? Math.max(0, Math.floor(config.minReplicas)) : 1;
  const maxReplicas = typeof config.maxReplicas === "number" ? Math.max(minReplicas, Math.floor(config.maxReplicas)) : 3;

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
      name: safeName,
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
              name: safeName,
              image:
                typeof config.containerImage === "string"
                  ? config.containerImage
                  : "nginx:latest",
              resources: { cpu: 0.5, memory: "1Gi" },
            },
          ],
          scale: { minReplicas, maxReplicas },
        },
      },
    },
  ];
}
// ---------------------------------------------------------------------------
// Logic App builder
// ---------------------------------------------------------------------------

function buildLogicApp(
  name: string,
  location: string,
  config: Record<string, unknown>,
  triggerType: "http" | "recurrence"
): ArmResource {
  const safeName = sanitizeGenericName(name, 43) || "sandbox-workflow";

  const trigger =
    triggerType === "http"
      ? {
          manual: {
            type: "Request",
            kind: "Http",
            inputs: { schema: {} },
          },
        }
      : (() => {
          const freq =
            typeof config.frequency === "string" ? config.frequency : "Week";
          const time =
            typeof config.runTime === "string" ? config.runTime : "09:00";
          return {
            Recurrence: {
              type: "Recurrence",
              recurrence: {
                frequency: freq,
                interval: 1,
                timeZone: "SE Asia Standard Time",
                startTime: `${new Date(Date.now() + 86400000).toISOString().split("T")[0]}T${time}:00`,
              },
            },
          };
        })();

  return {
    type: "Microsoft.Logic/workflows",
    apiVersion: "2019-05-01",
    name: safeName,
    location,
    properties: {
      state: "Enabled",
      definition: {
        $schema:
          "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
        contentVersion: "1.0.0.0",
        triggers: trigger,
        actions: {},
        outputs: {},
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Azure OpenAI (Foundry) connection builder
// ---------------------------------------------------------------------------
// Shared Foundry resource — one Azure OpenAI-compatible endpoint used by
// every logic-app / logic-app-storage deployment. API-key auth (not managed
// identity): simpler, no per-deployment role assignment on the Foundry
// resource. See docs/superpowers/specs/2026-07-13-logic-app-foundry-connection-design.md.
// ---------------------------------------------------------------------------

function requireFoundryConfig(
  apiKey: string | undefined,
  resourceName: string | undefined
): { apiKey: string; resourceName: string } {
  if (!apiKey || !resourceName) {
    throw new InvalidDeploymentConfigError(
      "Foundry API key/resource name not configured — set FOUNDRY_API_KEY and FOUNDRY_RESOURCE_NAME"
    );
  }
  return { apiKey, resourceName };
}

function buildAzureOpenAiConnection(
  name: string,
  location: string,
  resourceName: string,
  apiKey: string,
  deployParams: Record<string, { value: string }>
): ArmResource {
  const safeName = (sanitizeGenericName(name, 40) || "sandbox-workflow") + "-openai";
  deployParams["azureopenaiApiKey"] = { value: apiKey };

  return {
    type: "Microsoft.Web/connections",
    apiVersion: "2016-06-01",
    name: safeName,
    location,
    properties: {
      displayName: "Azure OpenAI (Foundry)",
      api: {
        id: `[concat(subscription().id, '/providers/Microsoft.Web/locations/${location}/managedApis/azureopenai')]`,
      },
      parameterValues: {
        azureOpenAIResourceName: resourceName,
        azureOpenAIApiKey: "[parameters('azureopenaiApiKey')]",
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Static Web App builder
// ---------------------------------------------------------------------------

function buildStaticWebApp(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource {
  const safeName = sanitizeGenericName(name, 40) || "sandbox-app";
  const skuName = typeof config.sku === "string" ? config.sku : "Free";

  return {
    type: "Microsoft.Web/staticSites",
    apiVersion: "2023-01-01",
    name: safeName,
    location,
    sku: { name: skuName, tier: skuName },
    properties: {
      stagingEnvironmentPolicy: "Enabled",
      allowConfigFileUpdates: true,
      enterpriseGradeCdnStatus: "Disabled",
    },
  };
}

// ---------------------------------------------------------------------------
// Service Bus namespace builder
// ---------------------------------------------------------------------------

function buildServiceBusNamespace(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource {
  const safeName = sanitizeGenericName(name, 50) || "sandbox-servicebus";
  const tier: string =
    typeof config.tier === "string" && ["Basic", "Standard", "Premium"].includes(config.tier)
      ? config.tier
      : "Basic";

  return {
    type: "Microsoft.ServiceBus/namespaces",
    apiVersion: "2022-10-01",
    name: safeName,
    location,
    sku: { name: tier },
    properties: {},
  };
}

// ---------------------------------------------------------------------------
// Event Grid topic builder
// ---------------------------------------------------------------------------

function buildEventGridTopic(
  name: string,
  location: string,
  config: Record<string, unknown>
): ArmResource {
  const safeName = sanitizeGenericName(name, 50) || "sandbox-events";
  const inputSchema =
    typeof config.inputSchema === "string" &&
    config.inputSchema === "CloudEventSchemaV1_0"
      ? "CloudEventSchemaV1_0"
      : "EventGridSchema";

  return {
    type: "Microsoft.EventGrid/topics",
    apiVersion: "2022-06-15",
    name: safeName,
    location,
    properties: { inputSchema },
  };
}

// ---------------------------------------------------------------------------
// Template-mode dispatcher
// ---------------------------------------------------------------------------

function buildTemplateResources(
  template: { slug: string; formValues: Record<string, unknown> },
  suffix = "",
  deployParams: Record<string, { value: string }> = {},
  foundryApiKey?: string,
  foundryResourceName?: string
): ArmResource[] {
  const { slug, formValues } = template;

  if (POLICY_BLOCKED_TEMPLATE_SLUGS.has(slug)) {
    throw new PolicyBlockedTemplateError(slug);
  }

  const location = resolveRegion(formValues.region);

  switch (slug) {
    case "approval-workflow":
      return [
        buildLogicApp(
          typeof formValues.workflowName === "string" ? formValues.workflowName : "sandbox-workflow",
          location,
          formValues,
          "http"
        ),
      ];
    case "scheduled-automation":
      return [
        buildLogicApp(
          typeof formValues.workflowName === "string" ? formValues.workflowName : "sandbox-workflow",
          location,
          formValues,
          "recurrence"
        ),
      ];
    case "static-web-app":
      return [
        buildStaticWebApp(
          typeof formValues.appName === "string" ? formValues.appName : "sandbox-app",
          location,
          formValues
        ),
      ];
    case "logic-app": {
      const workflowName = typeof formValues.workflowName === "string" ? formValues.workflowName : "sandbox-workflow";
      const foundry = requireFoundryConfig(foundryApiKey, foundryResourceName);
      return [
        buildLogicApp(workflowName, location, formValues, "http"),
        buildAzureOpenAiConnection(workflowName, location, foundry.resourceName, foundry.apiKey, deployParams),
      ];
    }
    case "logic-app-storage": {
      const workflowName = typeof formValues.workflowName === "string" ? formValues.workflowName : "sandbox-workflow";
      const foundry = requireFoundryConfig(foundryApiKey, foundryResourceName);
      return [
        buildLogicApp(workflowName, location, formValues, "http"),
        buildStorageAccount(
          typeof formValues.storageAccountName === "string" ? formValues.storageAccountName : "sandboxstorage",
          location,
          formValues,
          suffix
        ),
        buildAzureOpenAiConnection(workflowName, location, foundry.resourceName, foundry.apiKey, deployParams),
      ];
    }
    default:
      throw new Error(
        `Template slug "${slug}" has no ARM builder. ` +
        `Implement a builder or set policyBlocked: true in templates.json.`
      );
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
  tenantId: string,
  suffix = "",
  deployParams: Record<string, { value: string }>
): ArmResource[] {
  const armResources: ArmResource[] = [];

  for (const resource of resources) {
    const location = resolveRegion(resource.config.region);

    switch (resource.type) {
      case "Microsoft.Web/sites":
        armResources.push(...buildWebApplication(
          typeof resource.config.appName === "string" ? resource.config.appName : resource.name,
          location,
          resource.config
        ));
        break;
      case "Microsoft.Compute/virtualMachines":
        throw new Error(
          `Resource type "Microsoft.Compute/virtualMachines" is blocked by subscription policy COE-Allowed-Resources.`
        );
      case "Microsoft.DBforPostgreSQL/flexibleServers":
        armResources.push(buildPostgresServer(
          typeof resource.config.dbName === "string" ? resource.config.dbName : resource.name,
          location,
          resource.config,
          deployParams
        ));
        break;
      case "Microsoft.Storage/storageAccounts":
        armResources.push(buildStorageAccount(
          typeof resource.config.storageName === "string" ? resource.config.storageName : resource.name,
          location,
          resource.config,
          suffix
        ));
        break;
      case "Microsoft.Network/virtualNetworks":
        armResources.push(buildVirtualNetwork(
          typeof resource.config.vnetName === "string" ? resource.config.vnetName : resource.name,
          location,
          resource.config
        ));
        break;
      case "Microsoft.KeyVault/vaults":
        armResources.push(buildKeyVault(
          typeof resource.config.vaultName === "string" ? resource.config.vaultName : resource.name,
          location,
          { ...resource.config, purgeProtection: true },
          tenantId,
          suffix
        ));
        break;
      case "Microsoft.App/containerApps":
        armResources.push(...buildContainerApp(
          typeof resource.config.appName === "string" ? resource.config.appName : resource.name,
          location,
          resource.config
        ));
        break;
      case "Microsoft.Web/staticSites":
        armResources.push(buildStaticWebApp(
          typeof resource.config.appName === "string" ? resource.config.appName : resource.name,
          location,
          resource.config
        ));
        break;
      case "Microsoft.Logic/workflows":
        armResources.push(buildLogicApp(
          typeof resource.config.workflowName === "string" ? resource.config.workflowName : resource.name,
          location,
          resource.config,
          "http"
        ));
        break;
      case "Microsoft.ServiceBus/namespaces":
        armResources.push(buildServiceBusNamespace(
          typeof resource.config.namespaceName === "string" ? resource.config.namespaceName : resource.name,
          location,
          resource.config
        ));
        break;
      case "Microsoft.EventGrid/topics":
        armResources.push(buildEventGridTopic(
          typeof resource.config.topicName === "string" ? resource.config.topicName : resource.name,
          location,
          resource.config
        ));
        break;
      case "Microsoft.Sql/servers":
        armResources.push(...buildSqlServer(
          typeof resource.config.sqlServerName === "string" ? resource.config.sqlServerName : resource.name,
          "appdb",
          location,
          resource.config,
          deployParams
        ));
        break;
      default:
        throw new Error(
          `Resource type "${resource.type}" has no ARM builder in buildCustomResources.`
        );
    }
  }

  return armResources;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildArmTemplate(
  payload: DeploymentPayload,
  opts: {
    tenantId: string;
    tags?: Record<string, string>;
    submissionId?: string;
    foundryApiKey?: string;
    foundryResourceName?: string;
  }
): ArmTemplate {
  const uniqueSuffix = (opts.submissionId ?? "").replace(/-/g, "").slice(0, 8);
  const deployParams: Record<string, { value: string }> = {};

  const primaryResources =
    payload.mode === "template"
      ? buildTemplateResources(payload.template, uniqueSuffix, deployParams, opts.foundryApiKey, opts.foundryResourceName)
      : buildCustomResources(payload.resources, opts.tenantId, uniqueSuffix, deployParams);

  // COE-Enforce-Tag-Resources: every individual resource must carry the 4 policy tags.
  const taggedResources = opts.tags
    ? primaryResources.map((r) => ({ ...r, tags: opts.tags }))
    : primaryResources;

  const parameters: Record<string, unknown> = Object.fromEntries(
    Object.keys(deployParams).map((k) => [k, { type: "secureString" }])
  );

  return {
    $schema:
      "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    contentVersion: "1.0.0.0",
    parameters,
    resources: taggedResources,
    outputs: {},
    ...(Object.keys(deployParams).length > 0 && { _deployParameters: deployParams }),
  };
}
