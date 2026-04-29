import { describe, it, expect, vi, beforeEach } from "vitest";

// env.ts validates on import — set required vars before importing anything
// that transitively loads it (bicep-executor, processDeployment).
process.env.AZURE_SUBSCRIPTION_ID ??= "11111111-1111-1111-1111-111111111111";
process.env.AZURE_TENANT_ID ??= "22222222-2222-2222-2222-222222222222";
process.env.DEPLOYMENT_QUEUE ??= "test-queue";
process.env.NODE_ENV = "test";

// Mock the executor — we don't want to actually call Azure.
const executeBicepDeployment = vi.fn();
vi.mock("../../modules/deployments/bicep-executor.js", () => ({
  executeBicepDeployment,
}));

// @azure/functions registers a storage queue handler at module import via
// app.storageQueue(...). Stub it so the side effect is a no-op under test.
vi.mock("@azure/functions", () => ({
  app: { storageQueue: vi.fn() },
  InvocationContext: class {},
}));

const { processDeployment } = await import("../../functions/processDeployment.js");

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
    template: { slug: "storage-account", formValues: { storageName: "mystore" } },
  },
  tags: {
    "Cost Center": "CC01",
    "Project ID": "PID01",
    "Project Owner": "owner@test.com",
    "Expiry Date": "2026-12-31",
  },
  deployedBy: "user@test.com",
};

describe("processDeployment handler", () => {
  beforeEach(() => {
    executeBicepDeployment.mockReset();
  });

  it("returns without throwing when the message fails Zod validation", async () => {
    const ctx = makeContext();
    await expect(processDeployment({ nonsense: true }, ctx)).resolves.toBeUndefined();
    expect(executeBicepDeployment).not.toHaveBeenCalled();
    expect(ctx.error).toHaveBeenCalledWith(
      expect.stringContaining("Invalid queue message")
    );
  });

  it("parses a JSON string queue item before validation", async () => {
    executeBicepDeployment.mockResolvedValue("{}");
    const ctx = makeContext();
    await processDeployment(JSON.stringify(validMessage), ctx);
    expect(executeBicepDeployment).toHaveBeenCalledOnce();
  });

  it("invokes the executor with the parsed payload on a valid message", async () => {
    executeBicepDeployment.mockResolvedValue("{}");
    const ctx = makeContext();
    await processDeployment(validMessage, ctx);
    expect(executeBicepDeployment).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceGroupName: "rg-test",
        deploymentName: validMessage.submissionId,
        location: "southeastasia",
        payload: validMessage.payload,
        tags: validMessage.tags,
      })
    );
    expect(ctx.log).toHaveBeenCalledWith(
      expect.stringContaining("succeeded")
    );
  });

  it("propagates executor errors so the runtime can retry/poison the message", async () => {
    executeBicepDeployment.mockRejectedValue(new Error("ARM deployment failed: boom"));
    const ctx = makeContext();
    await expect(processDeployment(validMessage, ctx)).rejects.toThrow("ARM deployment failed");
  });
});
