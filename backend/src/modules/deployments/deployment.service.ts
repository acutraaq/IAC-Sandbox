import { type Deployment, DeploymentStatus } from "@prisma/client";
import { AppError } from "../../lib/errors.js";
import logger from "../../lib/logger.js";
import env from "../../lib/env.js";
import type { DeploymentPayload } from "./deployment.schema.js";
import {
  createDeployment,
  updateDeploymentStatus,
  findDeployment,
} from "./deployment.repo.js";
import { executeBicepDeployment } from "./bicep-executor.js";
import { deriveResourceGroupName, deriveLocation } from "./rg-name.js";

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

  void (async () => {
    try {
      await updateDeploymentStatus(submissionId, DeploymentStatus.running);

      const bicepOutput = await executeBicepDeployment({
        subscriptionId: env.AZURE_SUBSCRIPTION_ID,
        resourceGroupName,
        deploymentName: submissionId,
        payload,
        location,
        tags: payload.tags,
      });

      await updateDeploymentStatus(submissionId, DeploymentStatus.succeeded, {
        bicepOutput,
      });

      logger.info({ submissionId, resourceGroupName }, "Deployment completed successfully");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      logger.error({ submissionId, err }, "Deployment failed");

      await updateDeploymentStatus(submissionId, DeploymentStatus.failed, {
        errorMessage,
      }).catch((updateErr) => {
        logger.error({ submissionId, err: updateErr }, "Failed to update deployment status to failed");
      });
    }
  })();

  return { submissionId };
}

export async function getDeployment(submissionId: string): Promise<Deployment> {
  const deployment = await findDeployment(submissionId);

  if (deployment === null) {
    throw AppError.notFound(`Deployment '${submissionId}' not found`);
  }

  return deployment;
}
