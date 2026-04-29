import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.AZURE_SUBSCRIPTION_ID ??= "11111111-1111-1111-1111-111111111111";
process.env.AZURE_TENANT_ID ??= "22222222-2222-2222-2222-222222222222";
process.env.DEPLOYMENT_QUEUE ??= "test-queue";
process.env.NODE_ENV = "test";

const createOrUpdate = vi.fn();
const getToken = vi.fn(async () => ({ token: "fake-token", expiresOnTimestamp: Date.now() + 60_000 }));

vi.mock("@azure/arm-resources", () => ({
  ResourceManagementClient: vi.fn().mockImplementation(() => ({
    resourceGroups: { createOrUpdate },
  })),
}));

vi.mock("@azure/identity", () => ({
  DefaultAzureCredential: vi.fn().mockImplementation(() => ({ getToken })),
}));

const { executeBicepDeployment } = await import(
  "../../../modules/deployments/bicep-executor.js"
);

const TAGS = {
  "Cost Center": "CC01",
  "Project ID": "PID01",
  "Project Owner": "owner@test.com",
  "Expiry Date": "2026-12-31",
};

const VALID_STORAGE_PAYLOAD = {
  mode: "template" as const,
  tags: TAGS,
  template: { slug: "storage-account", formValues: { storageName: "mystore" } },
};

describe("executeBicepDeployment", () => {
  beforeEach(() => {
    createOrUpdate.mockReset();
    getToken.mockClear();
    vi.unstubAllGlobals();
  });

  it("applies the full tag set (policy + deployedBy + iac-submissionId) to the resource group", async () => {
    // First fetch (PUT create deployment) returns 400 — we only care about
    // observing the RG createOrUpdate tags, so we fail fast after that.
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => "simulated failure",
    });
    vi.stubGlobal("fetch", fetchFn);
    createOrUpdate.mockResolvedValue({});

    await expect(
      executeBicepDeployment({
        subscriptionId: "sub-1",
        resourceGroupName: "rg-1",
        deploymentName: "dep-1",
        payload: VALID_STORAGE_PAYLOAD,
        location: "southeastasia",
        tags: TAGS,
        deployedBy: "user@test.com",
      })
    ).rejects.toThrow();

    expect(createOrUpdate).toHaveBeenCalledOnce();
    const [rg, body] = createOrUpdate.mock.calls[0];
    expect(rg).toBe("rg-1");
    expect(body.location).toBe("southeastasia");
    expect(body.tags).toMatchObject({
      ...TAGS,
      deployedBy: "user@test.com",
      "iac-submissionId": "dep-1",
    });
  });

  it("sends an ARM template in Incremental mode with the full tag set on every resource", async () => {
    let putBody: unknown;
    const fetchFn = vi
      .fn()
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        putBody = JSON.parse(init.body as string);
        // Fail fast to short-circuit the polling loop
        return { ok: false, status: 400, text: async () => "stop" };
      });
    vi.stubGlobal("fetch", fetchFn);
    createOrUpdate.mockResolvedValue({});

    await expect(
      executeBicepDeployment({
        subscriptionId: "sub-1",
        resourceGroupName: "rg-1",
        deploymentName: "dep-xyz",
        payload: VALID_STORAGE_PAYLOAD,
        location: "southeastasia",
        tags: TAGS,
        deployedBy: "user@test.com",
      })
    ).rejects.toThrow();

    const sent = putBody as { properties: { template: { resources: Array<{ tags: Record<string, string> }> }; mode: string } };
    expect(sent.properties.mode).toBe("Incremental");
    expect(sent.properties.template.resources.length).toBeGreaterThan(0);
    for (const r of sent.properties.template.resources) {
      expect(r.tags).toMatchObject({
        ...TAGS,
        deployedBy: "user@test.com",
        "iac-submissionId": "dep-xyz",
      });
    }
  });

  it("throws PolicyBlockedTemplateError before touching Azure for blocked template slugs", async () => {
    vi.stubGlobal("fetch", vi.fn());

    await expect(
      executeBicepDeployment({
        subscriptionId: "sub-1",
        resourceGroupName: "rg-1",
        deploymentName: "dep-blocked",
        payload: {
          mode: "template",
          tags: TAGS,
          template: { slug: "data-pipeline", formValues: {} },
        },
        location: "southeastasia",
        tags: TAGS,
        deployedBy: "user@test.com",
      })
    ).rejects.toThrow(/blocked by subscription policy/);

    expect(createOrUpdate).not.toHaveBeenCalled();
  });
});
