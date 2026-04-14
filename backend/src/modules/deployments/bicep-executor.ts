import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential } from "@azure/identity";
import env from "../../lib/env.js";
import type { DeploymentPayload } from "./deployment.schema.js";

export interface BicepExecutorOptions {
  subscriptionId: string;
  resourceGroup: string;
  deploymentName: string;
  payload: DeploymentPayload;
}

function buildArmTemplate(payload: DeploymentPayload): Record<string, unknown> {
  // Minimal ARM JSON template — proves the full Azure round-trip works.
  // Real resource provisioning is added in a later phase.
  return {
    "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0",
    "parameters": {},
    "resources": [],
    "outputs": {
      "deploymentMode": {
        "type": "string",
        "value": payload.mode
      },
      "resourceCount": {
        "type": "int",
        "value": payload.mode === "custom" ? payload.resources.length : 1
      }
    }
  };
}

export async function executeBicepDeployment(
  opts: BicepExecutorOptions
): Promise<string> {
  const credential = new DefaultAzureCredential();
  const client = new ResourceManagementClient(credential, opts.subscriptionId);

  const template = buildArmTemplate(opts.payload);

  const result = await client.deployments.beginCreateOrUpdateAndWait(
    opts.resourceGroup,
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
