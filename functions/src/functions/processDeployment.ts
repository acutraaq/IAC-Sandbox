import { app, InvocationContext } from "@azure/functions";
import { z } from "zod";
import { executeBicepDeployment } from "../modules/deployments/bicep-executor.js";
import { deploymentPayloadSchema } from "../modules/deployments/deployment.schema.js";
import env from "../lib/env.js";

const deploymentJobMessageSchema = z.object({
  submissionId: z.string().uuid(),
  resourceGroupName: z.string().min(1),
  location: z.string().min(1),
  payload: deploymentPayloadSchema,
  tags: z.record(z.string(), z.string()),
});

async function processDeployment(
  queueItem: unknown,
  context: InvocationContext
): Promise<void> {
  const rawMessage = typeof queueItem === "string" ? JSON.parse(queueItem) : queueItem;
  const parsed = deploymentJobMessageSchema.safeParse(rawMessage);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    context.error(`Invalid queue message: ${detail}`);
    return;
  }
  const { submissionId, resourceGroupName, location, payload, tags } = parsed.data;

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
