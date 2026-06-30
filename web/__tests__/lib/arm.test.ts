import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@azure/arm-resources", () => ({
  ResourceManagementClient: vi.fn(),
}));

vi.mock("@azure/identity", () => {
  class DefaultAzureCredential {
    getToken = vi.fn().mockResolvedValue({ token: "fake-token", expiresOnTimestamp: Date.now() + 3600_000 });
  }
  class ManagedIdentityCredential {
    getToken = vi.fn().mockResolvedValue({ token: "mi-token", expiresOnTimestamp: Date.now() + 3600_000 });
  }
  return { DefaultAzureCredential, ManagedIdentityCredential };
});

vi.mock("@/lib/server-env", () => ({
  serverEnv: {
    AZURE_SUBSCRIPTION_ID: "00000000-0000-0000-0000-000000000000",
    AZURE_TENANT_ID: "00000000-0000-0000-0000-000000000000",
    AZURE_STORAGE_CONNECTION_STRING: "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==;EndpointSuffix=core.windows.net",
    SESSION_SECRET: "test_secret_at_least_32_chars_long_xxxxxx",
  },
}));

describe("getArmClient", () => {
  beforeEach(async () => {
    vi.resetModules();
    globalThis.fetch = vi.fn();
    delete process.env.WEBSITE_INSTANCE_ID;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns a client with deployments accessor", async () => {
    const { getArmClient } = await import("@/lib/arm");
    const client = getArmClient();
    expect(client).toBeDefined();
    expect(typeof client.deployments.get).toBe("function");
  });

  describe("deployments.get", () => {
    it("returns deployment when ARM responds with 200", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ properties: { provisioningState: "Succeeded" } }),
      } as Response);

      const { getArmClient } = await import("@/lib/arm");
      const client = getArmClient();
      const result = await client.deployments.get("my-rg", "my-deploy");
      expect(result.properties?.provisioningState).toBe("Succeeded");
    });

    it("throws Not Found error for 404", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 404,
        text: async () => "Not Found",
      } as Response);

      const { getArmClient } = await import("@/lib/arm");
      const client = getArmClient();
      await expect(client.deployments.get("missing-rg", "missing-deploy")).rejects.toThrow(
        "Not Found"
      );
    });

    it("throws error for non-404 failures", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "Server Error",
      } as Response);

      const { getArmClient } = await import("@/lib/arm");
      const client = getArmClient();
      await expect(client.deployments.get("bad-rg", "bad-deploy")).rejects.toThrow(
        "ARM deployments.get failed"
      );
    });
  });
});
