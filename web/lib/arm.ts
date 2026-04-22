import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential } from "@azure/identity";
import { serverEnv } from "@/lib/server-env";

/** Minimal shape of an ARM deployment GET response */
export interface ArmDeployment {
  properties?: {
    provisioningState?: string;
    timestamp?: Date;
    error?: {
      code?: string;
      message?: string;
    };
  };
}

/** Thin deployments accessor built on top of the credential token */
function makeDeploymentsAccessor(
  credential: DefaultAzureCredential,
  subscriptionId: string
) {
  return {
    async get(resourceGroupName: string, deploymentName: string): Promise<ArmDeployment> {
      const tokenResponse = await credential.getToken(
        "https://management.azure.com/.default"
      );
      const token = tokenResponse?.token;
      const url =
        `https://management.azure.com/subscriptions/${subscriptionId}` +
        `/resourcegroups/${resourceGroupName}/providers/Microsoft.Resources` +
        `/deployments/${deploymentName}?api-version=2021-04-01`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 404) {
        const err = Object.assign(new Error("Not Found"), { statusCode: 404 });
        throw err;
      }

      if (!res.ok) {
        const body = await res.text();
        const err = Object.assign(
          new Error(`ARM deployments.get failed: ${res.status} ${body}`),
          { statusCode: res.status }
        );
        throw err;
      }

      return res.json() as Promise<ArmDeployment>;
    },
  };
}

export type ArmClientWithDeployments = ResourceManagementClient & {
  deployments: ReturnType<typeof makeDeploymentsAccessor>;
};

export function getArmClient(): ArmClientWithDeployments {
  const credential = new DefaultAzureCredential();
  const base = new ResourceManagementClient(credential, serverEnv.AZURE_SUBSCRIPTION_ID);
  const deployments = makeDeploymentsAccessor(credential, serverEnv.AZURE_SUBSCRIPTION_ID);
  return Object.assign(base, { deployments });
}
