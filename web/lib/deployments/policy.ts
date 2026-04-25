import type { DeploymentPayload } from "./schema";

// Mirrors POLICY_ALLOWED_RESOURCE_TYPES in functions/src/modules/deployments/arm-template-builder.ts
// SYNC: keep in sync with the functions copy
const ALLOWED_RESOURCE_TYPES = new Set([
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
  "Microsoft.Network/networkInterfaces",
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

// Only slugs that have ARM builders in arm-template-builder.ts and are not policy-blocked
const DEPLOYABLE_SLUGS = new Set([
  "web-application",
  "database",
  "storage-account",
  "virtual-network",
  "key-vault",
  "container-app",
  "landing-zone",
  "approval-workflow",
  "scheduled-automation",
  "message-queue",
  "event-broadcaster",
  "full-stack-web-app",
]);

export interface PolicyViolation {
  blocked: string[];
}

export function validateDeploymentPolicy(payload: DeploymentPayload): PolicyViolation | null {
  if (payload.mode === "template") {
    if (!DEPLOYABLE_SLUGS.has(payload.template.slug)) {
      return { blocked: [payload.template.slug] };
    }
  } else {
    const blocked = payload.resources
      .map((r) => r.type)
      .filter((t) => !ALLOWED_RESOURCE_TYPES.has(t));
    if (blocked.length > 0) return { blocked };
  }
  return null;
}
