import type { DeploymentPayload } from "./deployment.schema.js";

export interface DeploymentJobMessage {
  submissionId: string;
  resourceGroupName: string;
  location: string;
  payload: DeploymentPayload;
  tags: Record<string, string>;
}
