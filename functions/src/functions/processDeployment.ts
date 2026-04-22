import { app, InvocationContext } from "@azure/functions";
import { executeBicepDeployment } from "../modules/deployments/bicep-executor.js";
import type { DeploymentPayload } from "../modules/deployments/deployment.schema.js";
import env from "../lib/env.js";

export interface DeploymentJobMessage {
  submissionId: string;
  resourceGroupName: string;
  location: string;
  payload: DeploymentPayload;
  tags: Record<string, string>;
}

async function processDeployment(
  queueItem: unknown,
  context: InvocationContext
): Promise<void> {
  const message: DeploymentJobMessage =
    typeof queueItem === "string"
      ? (JSON.parse(queueItem) as DeploymentJobMessage)
      : (queueItem as DeploymentJobMessage);

  const { submissionId, resourceGroupName, location, payload, tags } = message;

  context.log(`Processing deployment ${submissionId} for RG ${resourceGroupName}`);

  try {
    await executeBicepDeployment({
      subscriptionId: env.AZURE_SUBSCRIPTION_ID,
      resourceGroupName,
      deploymentName: submissionId,
      payload,
      location,
      tags,
    });

    context.log(`Deployment ${submissionId} succeeded`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    context.error(`Deployment ${submissionId} failed: ${errorMessage}`);
  }
}

app.storageQueue("processDeployment", {
  queueName: "deployment-jobs",
  connection: "DEPLOYMENT_QUEUE",
  handler: processDeployment,
});
