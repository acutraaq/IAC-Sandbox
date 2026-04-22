import type { DeploymentPayload } from "./schema";

type DeploymentPayloadWithoutTags =
  | Omit<Extract<DeploymentPayload, { mode: "template" }>, "tags">
  | Omit<Extract<DeploymentPayload, { mode: "custom" }>, "tags">;

export const SLUG_PRIMARY_FIELD: Record<string, string> = {
  "web-application": "appName",
  "virtual-machine": "vmName",
  "database": "dbName",
  "storage-account": "storageName",
  "virtual-network": "vnetName",
  "key-vault": "vaultName",
  "container-app": "appName",
  "landing-zone": "projectName",
};

export function deriveResourceGroupName(
  payload: DeploymentPayloadWithoutTags
): string {
  let base: string;

  if (payload.mode === "template") {
    const field = SLUG_PRIMARY_FIELD[payload.template.slug] ?? "sandbox";
    const value = payload.template.formValues[field];
    base =
      typeof value === "string" && value.length > 0
        ? value
        : payload.template.slug;
  } else {
    base = payload.resources[0]?.name ?? "sandbox";
  }

  return sanitise(base) + "-rg";
}

export function deriveLocation(payload: DeploymentPayload): string {
  if (payload.mode === "template") {
    const region = payload.template.formValues["region"];
    return typeof region === "string" ? region : "southeastasia";
  }
  const region = payload.resources[0]?.config["region"];
  return typeof region === "string" ? region : "southeastasia";
}

export function sanitise(name: string): string {
  const result = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_.()]/g, "")
    .replace(/\.+$/, "")
    .replace(/^[^a-z0-9]+/, "")
    .slice(0, 87);
  return result || "sandbox";
}
