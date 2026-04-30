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
  deployedBy: z.string().min(1),
});

export async function processDeployment(
  queueItem: unknown,
  context: InvocationContext
): Promise<void> {
  const rawMessage = typeof queueItem === "string" ? JSON.parse(queueItem) : queueItem;
  const parsed = deploymentJobMessageSchema.safeParse(rawMessage);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const preview = JSON.stringify(rawMessage).slice(0, 500);
    context.error(`Invalid queue message: ${detail} | raw: ${preview}`);
    // Return without throwing: malformed messages should NOT trigger the
    // Functions runtime retry loop (they will never succeed). They are
    // effectively dropped; poison queue is reserved for executor failures.
    return;
  }
  const { submissionId, resourceGroupName, location, payload, tags, deployedBy } = parsed.data;

  context.log(`Processing deployment ${submissionId} for RG ${resourceGroupName}`);

  // Any error here must propagate so the Functions runtime applies the retry
  // policy from host.json (maxDequeueCount: 3) and then routes the message
  // to deployment-jobs-poison for investigation.
  await executeBicepDeployment({
    subscriptionId: env.AZURE_SUBSCRIPTION_ID,
    resourceGroupName,
    deploymentName: submissionId,
    payload,
    location,
    tags,
    deployedBy,
    log: (msg) => context.log(msg),
  });

  context.log(`Deployment ${submissionId} succeeded`);
}

app.storageQueue("processDeployment", {
  queueName: "deployment-jobs",
  connection: "DEPLOYMENT_QUEUE",
  handler: processDeployment,
});
