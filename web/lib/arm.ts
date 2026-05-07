import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential, ManagedIdentityCredential, type TokenCredential } from "@azure/identity";
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
  credential: TokenCredential,
  subscriptionId: string
) {
  let cache: { token: string; expiresOn: number } | null = null;

  async function getToken(): Promise<string> {
    if (cache && Date.now() < cache.expiresOn - 60_000) {
      return cache.token;
    }
    const tokenResponse = await credential.getToken(
      "https://management.azure.com/.default"
    );
    if (!tokenResponse?.token) {
      throw new Error("Failed to acquire Azure credential token");
    }
    cache = {
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOnTimestamp ?? Date.now() + 300_000,
    };
    return tokenResponse.token;
  }

  return {
    async get(resourceGroupName: string, deploymentName: string): Promise<ArmDeployment> {
      const token = await getToken();
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
  const isAzure = !!process.env.WEBSITE_INSTANCE_ID;
  const credential: TokenCredential = isAzure
    ? new ManagedIdentityCredential()
    : new DefaultAzureCredential();
  const base = new ResourceManagementClient(credential, serverEnv.AZURE_SUBSCRIPTION_ID);
  const deployments = makeDeploymentsAccessor(credential, serverEnv.AZURE_SUBSCRIPTION_ID);
  return Object.assign(base, { deployments });
}
