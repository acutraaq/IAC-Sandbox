import { app, InvocationContext } from "@azure/functions";
import { DeploymentStatus } from "@prisma/client";
import { updateDeploymentStatus } from "../modules/deployments/deployment.repo.js";
import { executeBicepDeployment } from "../modules/deployments/bicep-executor.js";
import type { DeploymentPayload } from "../modules/deployments/deployment.schema.js";
import env from "../lib/env.js";
import db from "../lib/db.js";

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
    await updateDeploymentStatus(submissionId, DeploymentStatus.running);

    const bicepOutput = await executeBicepDeployment({
      subscriptionId: env.AZURE_SUBSCRIPTION_ID,
      resourceGroupName,
      deploymentName: submissionId,
      payload,
      location,
      tags,
    });

    await updateDeploymentStatus(submissionId, DeploymentStatus.succeeded, {
      bicepOutput,
    });

    context.log(`Deployment ${submissionId} succeeded`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    context.error(`Deployment ${submissionId} failed: ${errorMessage}`);

    await updateDeploymentStatus(submissionId, DeploymentStatus.failed, {
      errorMessage,
    }).catch((updateErr) => {
      context.error(`Failed to update status for ${submissionId}: ${String(updateErr)}`);
    });
  } finally {
    await db.$disconnect();
  }
}

app.storageQueue("processDeployment", {
  queueName: "deployment-jobs",
  connection: "DEPLOYMENT_QUEUE",
  handler: processDeployment,
});
