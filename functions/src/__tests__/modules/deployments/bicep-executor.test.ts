import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.AZURE_SUBSCRIPTION_ID ??= "11111111-1111-1111-1111-111111111111";
process.env.AZURE_TENANT_ID ??= "22222222-2222-2222-2222-222222222222";
process.env.DEPLOYMENT_QUEUE ??= "test-queue";
process.env.AZURE_STORAGE_CONNECTION_STRING ??= "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==;EndpointSuffix=core.windows.net";
process.env.FOUNDRY_API_KEY ??= "test-foundry-key";
process.env.FOUNDRY_RESOURCE_NAME ??= "test-foundry-resource";
process.env.NODE_ENV = "test";

const createOrUpdate = vi.hoisted(() => vi.fn());
const getToken = vi.hoisted(() => vi.fn(async () => ({ token: "fake-token", expiresOnTimestamp: Date.now() + 60_000 })));

vi.mock("@azure/arm-resources", () => ({
  ResourceManagementClient: vi.fn().mockImplementation(function () {
    return { resourceGroups: { createOrUpdate } };
  }),
}));

vi.mock("@azure/identity", () => ({
  DefaultAzureCredential: vi.fn().mockImplementation(function () {
    return { getToken };
  }),
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
  template: { slug: "approval-workflow", formValues: { workflowName: "mystore" } },
};

describe("executeBicepDeployment", () => {
  beforeEach(() => {
    createOrUpdate.mockReset();
    getToken.mockClear();
    vi.unstubAllGlobals();
  });

  it("applies the full tag set (policy + deployedBy + iac-submissionId) to the resource group", async () => {
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
      expect(r.tags).toMatchObject(TAGS);
      expect(r.tags).not.toHaveProperty("deployedBy");
      expect(r.tags).not.toHaveProperty("iac-submissionId");
    }
  });

  it("resolves when ARM deployment PUT returns 2xx (fire-and-forget)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ properties: { provisioningState: "Accepted" } }),
    }));
    createOrUpdate.mockResolvedValue({});

    await expect(
      executeBicepDeployment({
        subscriptionId: "sub-1",
        resourceGroupName: "rg-1",
        deploymentName: "dep-success",
        payload: VALID_STORAGE_PAYLOAD,
        location: "southeastasia",
        tags: TAGS,
        deployedBy: "user@test.com",
      })
    ).resolves.toBeUndefined();
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

  it("bakes the Foundry api key into the Logic App's own workflow parameters for logic-app payloads", async () => {
    let putBody: unknown;
    const fetchFn = vi
      .fn()
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        putBody = JSON.parse(init.body as string);
        return { ok: false, status: 400, text: async () => "stop" };
      });
    vi.stubGlobal("fetch", fetchFn);
    createOrUpdate.mockResolvedValue({});

    await expect(
      executeBicepDeployment({
        subscriptionId: "sub-1",
        resourceGroupName: "rg-1",
        deploymentName: "dep-ai",
        payload: {
          mode: "template",
          tags: TAGS,
          template: { slug: "logic-app", formValues: { workflowName: "ai-workflow" } },
        },
        location: "malaysiawest",
        tags: TAGS,
        deployedBy: "user@test.com",
      })
    ).rejects.toThrow();

    const sent = putBody as {
      properties: {
        template: {
          resources: Array<{
            type: string;
            properties: { parameters: Record<string, { value: string }> };
          }>;
        };
        parameters: Record<string, { value: string }>;
      };
    };
    const types = sent.properties.template.resources.map((r) => r.type);
    expect(types).toContain("Microsoft.Logic/workflows");
    expect(types).not.toContain("Microsoft.Web/connections");
    const logicApp = sent.properties.template.resources.find((r) => r.type === "Microsoft.Logic/workflows");
    expect(logicApp?.properties.parameters.foundryApiKey).toEqual({ value: "[parameters('azureopenaiApiKey')]" });
    expect(sent.properties.parameters.azureopenaiApiKey).toEqual({ value: process.env.FOUNDRY_API_KEY });
  });
});
