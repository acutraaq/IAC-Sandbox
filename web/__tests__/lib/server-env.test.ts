import { describe, it, expect } from "vitest";

const requiredVars = {
  AZURE_SUBSCRIPTION_ID: "00000000-0000-0000-0000-000000000000",
  AZURE_TENANT_ID: "00000000-0000-0000-0000-000000000000",
  AZURE_STORAGE_CONNECTION_STRING: "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==;EndpointSuffix=core.windows.net",
  SESSION_SECRET: "test_secret_at_least_32_chars_long_xxxxxx",
};

describe("server-env", () => {
  it("parses successfully with all required variables set", async () => {
    for (const [key, value] of Object.entries(requiredVars)) {
      process.env[key] = value;
    }
    // Re-import to pick up the new env vars
    const { serverEnv } = await import("@/lib/server-env");
    expect(serverEnv.AZURE_SUBSCRIPTION_ID).toBe(requiredVars.AZURE_SUBSCRIPTION_ID);
    expect(serverEnv.AZURE_TENANT_ID).toBe(requiredVars.AZURE_TENANT_ID);
    expect(serverEnv.SESSION_SECRET).toBe(requiredVars.SESSION_SECRET);
  });
});
