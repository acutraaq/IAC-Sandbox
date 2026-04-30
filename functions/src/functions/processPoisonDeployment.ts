import { app, InvocationContext } from "@azure/functions";
import { z } from "zod";
import { DefaultAzureCredential } from "@azure/identity";
import { deploymentPayloadSchema } from "../modules/deployments/deployment.schema.js";
import { createFailureRecord } from "../modules/deployments/failure-store.js";
import env from "../lib/env.js";

const deploymentJobMessageSchema = z.object({
  submissionId: z.string().uuid(),
  resourceGroupName: z.string().min(1),
  location: z.string().min(1),
  payload: deploymentPayloadSchema,
  tags: z.record(z.string(), z.string()),
  deployedBy: z.string().min(1),
});

async function fetchArmFailureReason(
  credential: DefaultAzureCredential,
  subscriptionId: string,
  rg: string,
  deploymentName: string
): Promise<string> {
  try {
    const tr = await credential.getToken("https://management.azure.com/.default");
    if (!tr?.token) return "Failed to acquire ARM token for failure lookup";
    const url = `https://management.azure.com/subscriptions/${subscriptionId}/resourcegroups/${rg}/providers/Microsoft.Resources/deployments/${deploymentName}?api-version=2021-04-01`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${tr.token}` },
    });
    if (res.status === 404) return "Deployment exhausted retries before reaching ARM";
    if (!res.ok) return `ARM deployment failed (HTTP ${res.status})`;
    const data = (await res.json()) as {
      properties?: { provisioningState?: string; error?: { code?: string; message?: string } };
    };
    const state = data.properties?.provisioningState;
    const armErr = data.properties?.error;
    if (state === "Failed" && armErr) {
      return `[${armErr.code ?? "Error"}] ${armErr.message ?? ""}`;
    }
    return `ARM deployment state: ${state ?? "unknown"} — exhausted retries`;
  } catch (err) {
    return `Could not query ARM for failure details: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function processPoisonDeployment(
  queueItem: unknown,
  context: InvocationContext
): Promise<void> {
  const rawMessage = typeof queueItem === "string" ? JSON.parse(queueItem) : queueItem;
  const parsed = deploymentJobMessageSchema.safeParse(rawMessage);

  if (!parsed.success) {
    const preview = JSON.stringify(rawMessage).slice(0, 500);
    context.error(`Poison queue: unparseable message — ${preview}`);
    return;
  }

  const { submissionId, resourceGroupName, deployedBy } = parsed.data;
  context.log(`Poisoned deployment ${submissionId} (RG: ${resourceGroupName})`);

  const credential = new DefaultAzureCredential();
  const armError = await fetchArmFailureReason(
    credential,
    env.AZURE_SUBSCRIPTION_ID,
    resourceGroupName,
    submissionId
  );

  await createFailureRecord(env.DEPLOYMENT_QUEUE, {
    submissionId,
    resourceGroupName,
    error: armError,
    deployedBy,
    failedAt: new Date().toISOString(),
  });

  context.log(`Failure recorded for ${submissionId}`);
}

app.storageQueue("processPoisonDeployment", {
  queueName: "deployment-jobs-poison",
  connection: "DEPLOYMENT_QUEUE",
  handler: processPoisonDeployment,
});
