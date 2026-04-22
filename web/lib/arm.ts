import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential } from "@azure/identity";
import { serverEnv } from "@/lib/server-env";

export function getArmClient(): ResourceManagementClient {
  return new ResourceManagementClient(
    new DefaultAzureCredential(),
    serverEnv.AZURE_SUBSCRIPTION_ID
  );
}
