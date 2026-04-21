import { type Deployment, DeploymentStatus } from "@prisma/client";
import { QueueServiceClient } from "@azure/storage-queue";
import { AppError } from "../../lib/errors.js";
import logger from "../../lib/logger.js";
import env from "../../lib/env.js";
import type { DeploymentPayload } from "./deployment.schema.js";
import {
  createDeployment,
  findDeployment,
} from "./deployment.repo.js";
import { deriveResourceGroupName, deriveLocation } from "./rg-name.js";
import type { DeploymentJobMessage } from "./deployment.job.js";

export async function submitDeployment(
  payload: DeploymentPayload
): Promise<{ submissionId: string }> {
  const resourceGroupName = deriveResourceGroupName(payload);
  const location = deriveLocation(payload);

  const deployment = await createDeployment({
    mode: payload.mode,
    submittedBy: "demo@sandbox.local",
    tenantId: env.AZURE_TENANT_ID,
    subscriptionId: env.AZURE_SUBSCRIPTION_ID,
    resourceGroup: resourceGroupName,
    payload,
  });

  const submissionId = deployment.id;

  const message: DeploymentJobMessage = {
    submissionId,
    resourceGroupName,
    location,
    payload,
    tags: payload.tags,
  };

  const queueClient = QueueServiceClient.fromConnectionString(
    env.AZURE_STORAGE_CONNECTION_STRING
  ).getQueueClient("deployment-jobs");

  await queueClient.sendMessage(
    Buffer.from(JSON.stringify(message)).toString("base64")
  );

  logger.info({ submissionId, resourceGroupName }, "Deployment enqueued");

  return { submissionId };
}

export async function getDeployment(submissionId: string): Promise<Deployment> {
  const deployment = await findDeployment(submissionId);

  if (deployment === null) {
    throw AppError.notFound(`Deployment '${submissionId}' not found`);
  }

  return deployment;
}
