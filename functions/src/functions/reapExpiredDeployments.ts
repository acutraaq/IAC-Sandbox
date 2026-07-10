import { app, InvocationContext, Timer } from "@azure/functions";
import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential } from "@azure/identity";
import env from "../lib/env.js";

const EXPIRY_TAG = "Expiry Date";
const SUBMISSION_TAG = "iac-submissionId";
const EXPIRY_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function isExpired(expiryDate: string, now: Date): boolean {
  if (!EXPIRY_DATE_REGEX.test(expiryDate)) return false;
  const expiry = new Date(`${expiryDate}T00:00:00.000Z`);
  if (Number.isNaN(expiry.getTime())) return false;
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return expiry.getTime() < todayUtc;
}

export async function reapExpiredDeployments(
  _timer: Timer,
  context: InvocationContext
): Promise<void> {
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, env.AZURE_SUBSCRIPTION_ID);
  const now = new Date();

  let checked = 0;
  let deleted = 0;
  let errors = 0;

  for await (const rg of client.resourceGroups.list()) {
    checked += 1;
    const name = rg.name;
    if (!name) continue;

    // Only ever touch resource groups this app created — proven by the
    // presence of our own iac-submissionId tag. Never reap anything else in
    // the subscription, even if it happens to carry an Expiry Date tag for
    // some unrelated reason.
    const tags = rg.tags ?? {};
    const submissionId = tags[SUBMISSION_TAG];
    const expiryDate = tags[EXPIRY_TAG];
    if (!submissionId || !expiryDate) continue;
    if (!isExpired(expiryDate, now)) continue;

    try {
      await client.resourceGroups.beginDelete(name);
      deleted += 1;
      context.log(
        `Reaped expired resource group ${name} (submissionId=${submissionId}, expired ${expiryDate})`
      );
    } catch (err) {
      errors += 1;
      context.error(
        `Failed to reap expired resource group ${name} (submissionId=${submissionId}): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  context.log(
    `reapExpiredDeployments complete — checked ${checked}, deleted ${deleted}, errors ${errors}`
  );
}

app.timer("reapExpiredDeployments", {
  // Daily at 03:00 UTC — off-peak, well clear of any deploy window.
  schedule: "0 0 3 * * *",
  handler: reapExpiredDeployments,
});
