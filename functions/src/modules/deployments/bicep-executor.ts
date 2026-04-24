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

export async function executeBicepDeployment(
  opts: BicepExecutorOptions
): Promise<string> {
  const { deploymentName: id, log } = opts;
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, opts.subscriptionId);

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
  let result;
  try {
    result = await withTimeout(
      client.deployments.beginCreateOrUpdateAndWait(
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
    // Fetch per-operation errors so the caller gets the real failure reason
    const reasons: string[] = [];
    try {
      const ops = client.deploymentOperations.list(opts.resourceGroupName, id);
      for await (const op of ops) {
        const status = op.properties?.provisioningState;
        const opErr = op.properties?.statusMessage as { error?: { code?: string; message?: string } } | undefined;
        if (status === "Failed" && opErr?.error) {
          reasons.push(`[${opErr.error.code ?? "Unknown"}] ${opErr.error.message ?? ""}`);
        }
      }
    } catch {
      // ignore — ops listing failed, fall through to original error
    }
    const detail = reasons.length > 0 ? reasons.join("; ") : (err instanceof Error ? err.message : String(err));
    throw new Error(`[${id}] ARM deployment failed: ${detail}`);
  }

  log?.(`[${id}] ARM deployment completed`);
  return JSON.stringify(result.properties?.outputs ?? {});
}
