const fallbackTenant = "3335e1a2-2058-4baf-b03b-031abf0fc821";
const fallbackSubscription = "1fed33d2-00fd-40a8-a5c1-c120aec1b902";

export function getPublicAzureEnv() {
  const tenantId = process.env.NEXT_PUBLIC_AZURE_TENANT_ID ?? fallbackTenant;
  const subscriptionId = process.env.NEXT_PUBLIC_AZURE_SUBSCRIPTION_ID ?? fallbackSubscription;

  if (!process.env.NEXT_PUBLIC_AZURE_TENANT_ID || !process.env.NEXT_PUBLIC_AZURE_SUBSCRIPTION_ID) {
    if (typeof console !== "undefined" && process.env.NODE_ENV === "development") {
      console.warn(
        "NEXT_PUBLIC_AZURE_TENANT_ID and/or NEXT_PUBLIC_AZURE_SUBSCRIPTION_ID are not set. Using fallback values."
      );
    }
  }

  return { tenantId, subscriptionId };
}
