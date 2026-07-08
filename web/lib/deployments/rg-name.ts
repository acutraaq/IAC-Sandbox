import type { DeploymentPayload } from "./schema";

export const ALLOWED_REGIONS = new Set(["malaysiawest"]);
const DEFAULT_REGION = "malaysiawest";

type DeploymentPayloadWithoutTags =
  | Omit<Extract<DeploymentPayload, { mode: "template" }>, "tags">
  | Omit<Extract<DeploymentPayload, { mode: "custom" }>, "tags">;

export const SLUG_PRIMARY_FIELD: Record<string, string> = {
  "approval-workflow":  "workflowName",
  "scheduled-automation": "workflowName",
  "logic-app":            "workflowName",
  "logic-app-storage":    "workflowName",
};

export function deriveResourceGroupName(
  payload: DeploymentPayloadWithoutTags,
  submissionId?: string,
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

  const suffix = submissionId ? `-${submissionId.slice(0, 6)}` : "";
  return sanitise(base, suffix.length) + suffix + "-rg";
}

export function deriveLocation(payload: DeploymentPayload): string {
  const raw =
    payload.mode === "template"
      ? payload.template.formValues["region"]
      : payload.resources[0]?.config["region"];
  const region = typeof raw === "string" ? raw : DEFAULT_REGION;
  return ALLOWED_REGIONS.has(region) ? region : DEFAULT_REGION;
}

export function sanitise(name: string, reserve: number = 0): string {
  const maxLen = 90 - reserve - 3; // reserve space for suffix and "-rg"
  const result = name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-_.()]/g, "")
    .replace(/\.+$/, "")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/-+$/, "")
    .slice(0, maxLen)
    .replace(/[-_.]+$/, "");
  return result || "sandbox";
}
