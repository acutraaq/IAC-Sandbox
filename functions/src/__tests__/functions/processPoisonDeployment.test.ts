import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.AZURE_SUBSCRIPTION_ID ??= "11111111-1111-1111-1111-111111111111";
process.env.AZURE_TENANT_ID ??= "22222222-2222-2222-2222-222222222222";
process.env.DEPLOYMENT_QUEUE ??= "test-queue";
process.env.AZURE_STORAGE_CONNECTION_STRING ??= "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==;EndpointSuffix=core.windows.net";
process.env.NODE_ENV = "test";

const mockCreateFailureRecord = vi.hoisted(() => vi.fn());
const mockBeginDelete = vi.hoisted(() => vi.fn());

vi.mock("../../modules/deployments/failure-store.js", () => ({
  createFailureRecord: mockCreateFailureRecord,
}));

vi.mock("@azure/identity", () => ({
  DefaultAzureCredential: vi.fn().mockImplementation(function () {
    return { getToken: vi.fn(async () => ({ token: "fake-token", expiresOnTimestamp: Date.now() + 60_000 })) };
  }),
}));

vi.mock("@azure/arm-resources", () => ({
  ResourceManagementClient: vi.fn().mockImplementation(function () {
    return { resourceGroups: { beginDelete: mockBeginDelete } };
  }),
}));

vi.mock("@azure/functions", () => ({
  app: { storageQueue: vi.fn() },
  InvocationContext: class {},
}));

const { processPoisonDeployment } = await import("../../functions/processPoisonDeployment.js");

function makeContext() {
  return {
    log: vi.fn(),
    error: vi.fn(),
  } as unknown as import("@azure/functions").InvocationContext;
}

const validMessage = {
  submissionId: "123e4567-e89b-12d3-a456-426614174000",
  resourceGroupName: "rg-test",
  location: "southeastasia",
  payload: {
    mode: "template" as const,
    tags: {
      "Cost Center": "CC01",
      "Project ID": "PID01",
      "Project Owner": "owner@test.com",
      "Expiry Date": "2026-12-31",
    },
    template: { slug: "approval-workflow", formValues: { workflowName: "mystore" } },
  },
  tags: {
    "Cost Center": "CC01",
    "Project ID": "PID01",
    "Project Owner": "owner@test.com",
    "Expiry Date": "2026-12-31",
  },
  deployedBy: "user@test.com",
};

describe("processPoisonDeployment handler", () => {
  beforeEach(() => {
    mockCreateFailureRecord.mockReset();
    mockBeginDelete.mockReset();
    mockBeginDelete.mockResolvedValue(undefined);
  });

  it("writes a failure record for a valid poisoned message", async () => {
    const ctx = makeContext();
    await processPoisonDeployment(validMessage, ctx);
    expect(mockCreateFailureRecord).toHaveBeenCalledOnce();
    const args = mockCreateFailureRecord.mock.calls[0];
    expect(args[0]).toBe(process.env.AZURE_STORAGE_CONNECTION_STRING);
    expect(args[1].submissionId).toBe(validMessage.submissionId);
    expect(args[1].resourceGroupName).toBe(validMessage.resourceGroupName);
    expect(args[1].deployedBy).toBe(validMessage.deployedBy);
    expect(args[1].error).toContain("exhausted retries");
    expect(ctx.log).toHaveBeenCalledWith(
      expect.stringContaining("Failure recorded")
    );
  });

  it("logs an error and returns for an unparseable poisoned message", async () => {
    const ctx = makeContext();
    await processPoisonDeployment({ nonsense: true }, ctx);
    expect(mockCreateFailureRecord).not.toHaveBeenCalled();
    expect(mockBeginDelete).not.toHaveBeenCalled();
    expect(ctx.error).toHaveBeenCalledWith(
      expect.stringContaining("unparseable message")
    );
  });

  it("parses a JSON string queue item", async () => {
    const ctx = makeContext();
    await processPoisonDeployment(JSON.stringify(validMessage), ctx);
    expect(mockCreateFailureRecord).toHaveBeenCalledOnce();
  });

  it("deletes the orphaned resource group after recording the failure", async () => {
    const ctx = makeContext();
    await processPoisonDeployment(validMessage, ctx);
    expect(mockBeginDelete).toHaveBeenCalledOnce();
    expect(mockBeginDelete).toHaveBeenCalledWith(validMessage.resourceGroupName);
    expect(ctx.log).toHaveBeenCalledWith(
      expect.stringContaining(`Deleting orphaned resource group ${validMessage.resourceGroupName}`)
    );
  });

  it("logs but does not throw when orphaned RG deletion fails", async () => {
    mockBeginDelete.mockRejectedValueOnce(new Error("RG not found"));
    const ctx = makeContext();
    await expect(processPoisonDeployment(validMessage, ctx)).resolves.toBeUndefined();
    expect(ctx.error).toHaveBeenCalledWith(
      expect.stringContaining(`failed to delete orphaned RG ${validMessage.resourceGroupName}`)
    );
  });

  it("still writes the failure record even if RG deletion later fails", async () => {
    mockBeginDelete.mockRejectedValueOnce(new Error("boom"));
    const ctx = makeContext();
    await processPoisonDeployment(validMessage, ctx);
    expect(mockCreateFailureRecord).toHaveBeenCalledOnce();
  });
});
