import type { DeploymentPayload } from "./schema";

// Mirrors POLICY_ALLOWED_RESOURCE_TYPES in functions/src/modules/deployments/arm-template-builder.ts.
// SYNC: keep in sync with the functions copy.
// Scoped to exactly the resource types buildCustomResources() can build — not
// the full COE-Allowed-Resources subscription policy — so an unsupported type
// is rejected here (400) instead of passing validation, enqueueing, and then
// throwing/poison-queueing inside the Function App.
const ALLOWED_RESOURCE_TYPES = new Set([
  "Microsoft.Web/sites",
  "Microsoft.DBforPostgreSQL/flexibleServers",
  "Microsoft.Storage/storageAccounts",
  "Microsoft.Network/virtualNetworks",
  "Microsoft.KeyVault/vaults",
  "Microsoft.App/containerApps",
  "Microsoft.Web/staticSites",
  "Microsoft.Logic/workflows",
  "Microsoft.ServiceBus/namespaces",
  "Microsoft.EventGrid/topics",
  "Microsoft.Sql/servers",
]);

// Only slugs that have ARM builders in arm-template-builder.ts and are not policy-blocked
const DEPLOYABLE_SLUGS = new Set([
  "logic-app",
  "logic-app-storage",
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
