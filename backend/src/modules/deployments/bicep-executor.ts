import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential } from "@azure/identity";
import env from "../../lib/env.js";
import type { DeploymentPayload } from "./deployment.schema.js";
import { buildArmTemplate } from "./arm-template-builder.js";

export interface BicepExecutorOptions {
  subscriptionId: string;
  resourceGroupName: string;
  deploymentName: string;
  payload: DeploymentPayload;
  location: string;
}

export async function executeBicepDeployment(
  opts: BicepExecutorOptions
): Promise<string> {
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, opts.subscriptionId);

  // Step 1: create the resource group (idempotent — safe to call if it already exists)
  await client.resourceGroups.createOrUpdate(opts.resourceGroupName, {
    location: opts.location,
  });

  // Step 2: deploy ARM template into the resource group
  const template = buildArmTemplate(opts.payload, { tenantId: env.AZURE_TENANT_ID });

  const result = await client.deployments.beginCreateOrUpdateAndWait(
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

  return JSON.stringify(result.properties?.outputs ?? {});
}
