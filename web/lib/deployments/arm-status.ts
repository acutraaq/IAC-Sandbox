import type { DeploymentStatus } from "@/types";

export function mapArmProvisioningState(state: string | undefined): DeploymentStatus {
  if (!state) return "accepted";
  const lower = state.toLowerCase();
  if (lower === "succeeded") return "succeeded";
  if (lower === "failed" || lower === "canceled") return "failed";
  return "running";
}
