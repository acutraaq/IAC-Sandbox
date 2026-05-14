import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential } from "@azure/identity";
import env from "../../lib/env.js";
import type { DeploymentPayload } from "./deployment.schema.js";
import { buildArmTemplate, validateTemplateAgainstPolicy } from "./arm-template-builder.js";

export interface BicepExecutorOptions {
  subscriptionId: string;
  resourceGroupName: string;
  deploymentName: string;
  payload: DeploymentPayload;
  location: string;
  tags: Record<string, string>;
  deployedBy: string;
  log?: (msg: string) => void;
}

const ARM_API = "2021-04-01";

// ---------------------------------------------------------------------------
// Main executor — fire-and-forget pattern
//
// Creates the RG, submits the ARM deployment PUT, returns immediately.
// ARM runs server-side; the web app polls completion via
// GET /api/deployments/[submissionId] which reads ARM state directly.
//
// Token discipline: DefaultAzureCredential maintains its own cache.
// Call getToken() at each use site — never hold a token reference across
// async operations. The second call is a cache hit (~0 ms).
// ---------------------------------------------------------------------------

export async function executeBicepDeployment(
  opts: BicepExecutorOptions
): Promise<void> {
  const { deploymentName: id, log } = opts;
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, opts.subscriptionId);

  // Verify managed identity is reachable before touching any Azure resource.
  // Surfaces misconfiguration early with a clear error rather than a cryptic
  // 401 deep inside createOrUpdate or the deployment PUT.
  try {
    const probe = await credential.getToken("https://management.azure.com/.default");
    if (!probe?.token) throw new Error("no token returned");
    log?.(`[${id}] ARM token acquired (expires ${probe.expiresOnTimestamp})`);
  } catch (tokenErr) {
    const msg = tokenErr instanceof Error ? tokenErr.message : String(tokenErr);
    throw new Error(`[${id}] Failed to acquire ARM token: ${msg}`);
  }

  // Build and validate ARM template against subscription policy before
  // touching Azure — avoids creating an empty RG on a policy violation.
  log?.(`[${id}] Building ARM template`);
  const fullTags = {
    ...opts.tags,
    deployedBy: opts.deployedBy,
    "iac-submissionId": id,
  };
  const template = buildArmTemplate(opts.payload, {
    tenantId: env.AZURE_TENANT_ID,
    tags: opts.tags,
    submissionId: id,
  });

  const blockedTypes = validateTemplateAgainstPolicy(template);
  if (blockedTypes.length > 0) {
    throw new Error(
      `[${id}] Deployment blocked by subscription policy COE-Allowed-Resources. ` +
      `The following resource types are not permitted: ${blockedTypes.join(", ")}`
    );
  }

  // Create resource group with full 6 tags (idempotent — safe on retry).
  log?.(`[${id}] Creating resource group ${opts.resourceGroupName}`);
  await client.resourceGroups.createOrUpdate(opts.resourceGroupName, {
    location: opts.location,
    tags: fullTags,
  });

  // Acquire a fresh token at call site. DefaultAzureCredential returns the
  // cached token from the probe above (~0 ms) — no extra network round-trip.
  const tokenResult = await credential.getToken("https://management.azure.com/.default");
  if (!tokenResult?.token) throw new Error(`[${id}] Failed to re-acquire ARM token`);

  // Submit ARM deployment and return. A non-2xx response means ARM rejected
  // the request synchronously; throw so the Functions runtime retries.
  log?.(`[${id}] Submitting ARM deployment`);
  const url =
    `https://management.azure.com/subscriptions/${opts.subscriptionId}` +
    `/resourcegroups/${opts.resourceGroupName}` +
    `/providers/Microsoft.Resources/deployments/${id}` +
    `?api-version=${ARM_API}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokenResult.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        mode: "Incremental",
        template: template as unknown as Record<string, unknown>,
        parameters: {},
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[${id}] ARM deployment create failed: ${res.status} ${text}`);
  }

  // Parse the initial provisioningState from the response for observability.
  // ARM typically returns "Accepted" or "Running" on a successful submission.
  const body = await res.json().catch(() => null) as
    | { properties?: { provisioningState?: string } }
    | null;
  const initialState = body?.properties?.provisioningState ?? "unknown";
  log?.(`[${id}] ARM deployment submitted — initial state: ${initialState}`);
}
