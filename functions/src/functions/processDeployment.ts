import { app, InvocationContext } from "@azure/functions";
import { executeBicepDeployment } from "../modules/deployments/bicep-executor.js";
import { deploymentJobMessageSchema } from "../modules/deployments/deployment.schema.js";
import { InvalidDeploymentConfigError } from "../modules/deployments/arm-template-builder.js";
import env from "../lib/env.js";

export async function processDeployment(
  queueItem: unknown,
  context: InvocationContext
): Promise<void> {
  const preview = JSON.stringify(queueItem).slice(0, 200);
  context.log(`processDeployment received queue item (type=${typeof queueItem}, preview=${preview})`);

  let rawMessage: unknown;
  try {
    rawMessage = typeof queueItem === "string" ? JSON.parse(queueItem) : queueItem;
  } catch (_parseErr) {
    context.error(`Queue item is not valid JSON: ${preview}`);
    return;
  }

  const parsed = deploymentJobMessageSchema.safeParse(rawMessage);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    const rawPreview = JSON.stringify(rawMessage).slice(0, 500);
    context.error(`Invalid queue message: ${detail} | raw: ${rawPreview}`);
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
  // Exception: InvalidDeploymentConfigError means the message itself is
  // malformed — retrying will never succeed, so log and return (no throw).
  try {
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
  } catch (err) {
    if (err instanceof InvalidDeploymentConfigError) {
      context.error(`Deployment ${submissionId} has invalid config: ${err.message}`);
      return;
    }
    throw err;
  }

  context.log(`Deployment ${submissionId} submitted to ARM`);
}

app.storageQueue("processDeployment", {
  queueName: "deployment-jobs",
  connection: "DEPLOYMENT_QUEUE",
  handler: processDeployment,
});
