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
}

export async function executeBicepDeployment(
  opts: BicepExecutorOptions
): Promise<string> {
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, opts.subscriptionId);

  // Step 1: build and validate the ARM template against subscription policy
  // before touching Azure — avoids creating an empty RG on policy violations.
  const template = buildArmTemplate(opts.payload, { tenantId: env.AZURE_TENANT_ID });

  const blockedTypes = validateTemplateAgainstPolicy(template);
  if (blockedTypes.length > 0) {
    throw new Error(
      `Deployment blocked by subscription policy COE-Allowed-Resources. ` +
      `The following resource types are not permitted: ${blockedTypes.join(", ")}`
    );
  }

  // Step 2: create the resource group with required policy tags (idempotent)
  await client.resourceGroups.createOrUpdate(opts.resourceGroupName, {
    location: opts.location,
    tags: opts.tags,
  });

  // Step 3: deploy ARM template into the resource group

  let result;
  try {
    result = await client.deployments.beginCreateOrUpdateAndWait(
      opts.resourceGroupName,
      opts.deploymentName,
      {
        properties: {
          mode: "Incremental",
          template,
          parameters: {},
        },
      }
    );
  } catch (err) {
    // Fetch per-operation errors so the caller gets the real failure reason
    const reasons: string[] = [];
    try {
      const ops = client.deploymentOperations.list(
        opts.resourceGroupName,
        opts.deploymentName
      );
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
    throw new Error(`ARM deployment failed: ${detail}`);
  }

  return JSON.stringify(result.properties?.outputs ?? {});
}
