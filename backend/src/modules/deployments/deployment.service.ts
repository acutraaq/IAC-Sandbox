import { type Deployment, DeploymentStatus } from "@prisma/client";
import { AppError } from "../../lib/errors.js";
import logger from "../../lib/logger.js";
import type { DeploymentPayload } from "./deployment.schema.js";
import {
  createDeployment,
  updateDeploymentStatus,
  findDeployment,
} from "./deployment.repo.js";
import { executeBicepDeployment } from "./bicep-executor.js";

export interface SubmitDeploymentUser {
  submittedBy: string;
  tenantId: string;
  subscriptionId: string;
  resourceGroup: string;
}

export async function submitDeployment(
  payload: DeploymentPayload,
  user: SubmitDeploymentUser
): Promise<{ submissionId: string }> {
  const deployment = await createDeployment({
    mode: payload.mode,
    submittedBy: user.submittedBy,
    tenantId: user.tenantId,
    subscriptionId: user.subscriptionId,
    resourceGroup: user.resourceGroup,
    payload,
  });

  const submissionId = deployment.id;

  // Fire-and-forget: run Bicep deployment asynchronously without blocking the response
  void (async () => {
    try {
      await updateDeploymentStatus(submissionId, DeploymentStatus.running);

      const bicepOutput = await executeBicepDeployment({
        subscriptionId: user.subscriptionId,
        resourceGroup: user.resourceGroup,
        deploymentName: submissionId,
        payload,
      });

      await updateDeploymentStatus(submissionId, DeploymentStatus.succeeded, {
        bicepOutput,
      });

      logger.info(
        { submissionId },
        "Bicep deployment completed successfully"
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);

      logger.error(
        { submissionId, err },
        "Bicep deployment failed"
      );

      await updateDeploymentStatus(submissionId, DeploymentStatus.failed, {
        errorMessage,
      }).catch((updateErr) => {
        logger.error(
          { submissionId, err: updateErr },
          "Failed to update deployment status to failed"
        );
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
