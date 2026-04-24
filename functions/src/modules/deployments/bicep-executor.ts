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
  log?: (msg: string) => void;
}

// ---------------------------------------------------------------------------
// Timeout helper
// ---------------------------------------------------------------------------

const DEPLOYMENT_TIMEOUT_MS = 25 * 60 * 1000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const race = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`[${label}] ARM deployment timed out after ${ms / 1000}s`)),
      ms
    );
  });
  return Promise.race([promise, race]).finally(() => clearTimeout(timer));
}

// ---------------------------------------------------------------------------
// Custom fetch-based deployments accessor
// @azure/arm-resources v7 removed the deployments namespace — we use the
// ARM REST API directly, mirroring the pattern in web/lib/arm.ts.
// ---------------------------------------------------------------------------

interface OperationItem {
  properties?: {
    provisioningState?: string;
    statusMessage?: unknown;
  };
}

interface DeploymentResult {
  properties?: {
    provisioningState?: string;
    outputs?: unknown;
  };
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function makeDeploymentsAccessor(credential: DefaultAzureCredential, subscriptionId: string) {
  const base = `https://management.azure.com/subscriptions/${subscriptionId}`;
  const API = "2021-04-01";
  const POLL_INTERVAL_MS = 15_000;

  async function getToken(): Promise<string> {
    const tr = await credential.getToken("https://management.azure.com/.default");
    if (!tr?.token) throw new Error("Failed to acquire ARM token");
    return tr.token;
  }

  return {
    async beginCreateOrUpdateAndWait(rg: string, name: string, body: unknown): Promise<DeploymentResult> {
      const url = `${base}/resourcegroups/${rg}/providers/Microsoft.Resources/deployments/${name}?api-version=${API}`;
      const token = await getToken();
      const res = await fetch(url, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`ARM deployment create failed: ${res.status} ${text}`);
      }
      // Poll until terminal state (Succeeded / Failed / Canceled)
      while (true) {
        await sleep(POLL_INTERVAL_MS);
        const pollToken = await getToken();
        const pollRes = await fetch(url, { headers: { Authorization: `Bearer ${pollToken}` } });
        if (!pollRes.ok) throw new Error(`ARM deployment poll failed: ${pollRes.status}`);
        const data = await pollRes.json() as DeploymentResult;
        const state = data.properties?.provisioningState;
        if (state === "Succeeded") return data;
        if (state === "Failed" || state === "Canceled") throw new Error(`ARM deployment ${state}`);
        // Running / Accepted — continue polling
      }
    },

    async listOperations(rg: string, name: string): Promise<OperationItem[]> {
      const url = `${base}/resourcegroups/${rg}/providers/Microsoft.Resources/deployments/${name}/operations?api-version=${API}`;
      const token = await getToken();
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      const body = await res.json() as { value?: OperationItem[] };
      return body.value ?? [];
    },
  };
}

// ---------------------------------------------------------------------------
// Type guards
// ---------------------------------------------------------------------------

function isStatusMessage(v: unknown): v is { error?: { code?: string; message?: string } } {
  return typeof v === "object" && v !== null;
}

// ---------------------------------------------------------------------------
// Operation error fetcher — best-effort, never throws
// ---------------------------------------------------------------------------

async function fetchOperationErrors(
  accessor: { listOperations: (rg: string, name: string) => Promise<OperationItem[]> },
  rg: string,
  deploymentName: string,
  log?: (msg: string) => void
): Promise<string> {
  try {
    const ops = await accessor.listOperations(rg, deploymentName);
    const reasons: string[] = [];
    for (const op of ops) {
      const state = op.properties?.provisioningState;
      const msg = op.properties?.statusMessage;
      if (state === "Failed" && isStatusMessage(msg) && msg.error) {
        reasons.push(`[${msg.error.code ?? "Unknown"}] ${msg.error.message ?? ""}`);
      }
    }
    return reasons.join("; ");
  } catch {
    log?.(`[${deploymentName}] Could not retrieve operation errors`);
    return "(could not retrieve operation errors)";
  }
}

// ---------------------------------------------------------------------------
// Main executor
// ---------------------------------------------------------------------------

export async function executeBicepDeployment(
  opts: BicepExecutorOptions
): Promise<string> {
  const { deploymentName: id, log } = opts;
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, opts.subscriptionId);
  const deployments = makeDeploymentsAccessor(credential, opts.subscriptionId);

  // Step 1: build and validate the ARM template against subscription policy
  // before touching Azure — avoids creating an empty RG on policy violations.
  log?.(`[${id}] Building ARM template`);
  const template = buildArmTemplate(opts.payload, { tenantId: env.AZURE_TENANT_ID, tags: opts.tags });

  const blockedTypes = validateTemplateAgainstPolicy(template);
  if (blockedTypes.length > 0) {
    throw new Error(
      `[${id}] Deployment blocked by subscription policy COE-Allowed-Resources. ` +
      `The following resource types are not permitted: ${blockedTypes.join(", ")}`
    );
  }

  // Step 2: create the resource group with required policy tags (idempotent)
  log?.(`[${id}] Creating resource group ${opts.resourceGroupName}`);
  await client.resourceGroups.createOrUpdate(opts.resourceGroupName, {
    location: opts.location,
    tags: {
      ...opts.tags,
      deployedBy: "demo@sandbox.local",
      "iac-submissionId": id,
    },
  });

  // Step 3: deploy ARM template into the resource group
  log?.(`[${id}] Starting ARM deployment`);
  let result: DeploymentResult;
  try {
    result = await withTimeout(
      deployments.beginCreateOrUpdateAndWait(
        opts.resourceGroupName,
        id,
        {
          properties: {
            mode: "Incremental",
            template: template as unknown as Record<string, unknown>,
            parameters: {},
          },
        }
      ),
      DEPLOYMENT_TIMEOUT_MS,
      id
    );
  } catch (err) {
    const reasons = await fetchOperationErrors(deployments, opts.resourceGroupName, id, log);
    const detail = reasons || (err instanceof Error ? err.message : String(err));
    throw new Error(`[${id}] ARM deployment failed: ${detail}`);
  }

  log?.(`[${id}] ARM deployment completed`);
  return JSON.stringify(result.properties?.outputs ?? {});
}
