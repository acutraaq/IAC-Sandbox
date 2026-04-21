import { DeploymentStatus } from "@prisma/client";
import db from "../../lib/db.js";

export async function updateDeploymentStatus(
  id: string,
  status: DeploymentStatus,
  opts?: { bicepOutput?: string; errorMessage?: string }
): Promise<void> {
  await db.deployment.update({
    where: { id },
    data: {
      status,
      ...(opts?.bicepOutput !== undefined ? { bicepOutput: opts.bicepOutput } : {}),
      ...(opts?.errorMessage !== undefined ? { errorMessage: opts.errorMessage } : {}),
    },
  });
}
