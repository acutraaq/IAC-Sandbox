import { type Deployment, DeploymentStatus } from "@prisma/client";
import db from "../../lib/db.js";
import type { DeploymentPayload } from "./deployment.schema.js";

export interface CreateDeploymentData {
  mode: "template" | "custom";
  submittedBy: string;
  tenantId: string;
  subscriptionId: string;
  resourceGroup: string;
  payload: DeploymentPayload;
}

export async function createDeployment(
  data: CreateDeploymentData
): Promise<Deployment> {
  return db.deployment.create({
    data: {
      mode: data.mode,
      status: DeploymentStatus.accepted,
      submittedBy: data.submittedBy,
      tenantId: data.tenantId,
      subscriptionId: data.subscriptionId,
      resourceGroup: data.resourceGroup,
      payload: data.payload as Parameters<
        typeof db.deployment.create
      >[0]["data"]["payload"],
    },
  });
}

export async function updateDeploymentStatus(
  id: string,
  status: DeploymentStatus,
  opts?: { bicepOutput?: string; errorMessage?: string }
): Promise<void> {
  await db.deployment.update({
    where: { id },
    data: {
      status,
      ...(opts?.bicepOutput !== undefined
        ? { bicepOutput: opts.bicepOutput }
        : {}),
      ...(opts?.errorMessage !== undefined
        ? { errorMessage: opts.errorMessage }
        : {}),
    },
  });
}

export async function findDeployment(id: string): Promise<Deployment | null> {
  return db.deployment.findUnique({ where: { id } });
}
