import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.AZURE_SUBSCRIPTION_ID ??= "11111111-1111-1111-1111-111111111111";
process.env.AZURE_TENANT_ID ??= "22222222-2222-2222-2222-222222222222";
process.env.DEPLOYMENT_QUEUE ??= "test-queue";
process.env.AZURE_STORAGE_CONNECTION_STRING ??= "test-connection-string";
process.env.FOUNDRY_API_KEY ??= "test-foundry-key";
process.env.FOUNDRY_RESOURCE_NAME ??= "test-foundry-resource";
process.env.FOUNDRY_MODEL_DEPLOYMENT_NAME ??= "test-foundry-model";
process.env.NODE_ENV = "test";

const mockList = vi.hoisted(() => vi.fn());
const mockBeginDelete = vi.hoisted(() => vi.fn());

vi.mock("@azure/arm-resources", () => ({
  ResourceManagementClient: vi.fn().mockImplementation(function () {
    return { resourceGroups: { list: mockList, beginDelete: mockBeginDelete } };
  }),
}));

vi.mock("@azure/identity", () => ({
  DefaultAzureCredential: vi.fn().mockImplementation(function () {
    return {};
  }),
}));

vi.mock("@azure/functions", () => ({
  app: { timer: vi.fn() },
  InvocationContext: class {},
}));

const { reapExpiredDeployments, isExpired } = await import(
  "../../functions/reapExpiredDeployments.js"
);

function makeContext() {
  return {
    log: vi.fn(),
    error: vi.fn(),
  } as unknown as import("@azure/functions").InvocationContext;
}

function makeAsyncIterable<T>(items: T[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const item of items) yield item;
    },
  };
}

describe("isExpired", () => {
  it("returns true for a date before today", () => {
    expect(isExpired("2020-01-01", new Date("2026-07-08T12:00:00Z"))).toBe(true);
  });

  it("returns false for today's date (still valid through end of day)", () => {
    expect(isExpired("2026-07-08", new Date("2026-07-08T23:59:00Z"))).toBe(false);
  });

  it("returns false for a future date", () => {
    expect(isExpired("2099-01-01", new Date("2026-07-08T12:00:00Z"))).toBe(false);
  });

  it("returns false for a malformed date string", () => {
    expect(isExpired("not-a-date", new Date("2026-07-08T12:00:00Z"))).toBe(false);
  });
});

describe("reapExpiredDeployments", () => {
  beforeEach(() => {
    mockList.mockReset();
    mockBeginDelete.mockReset();
  });

  it("deletes only resource groups that are both app-owned and expired", async () => {
    mockList.mockReturnValue(
      makeAsyncIterable([
        { name: "expired-rg", tags: { "iac-submissionId": "sub-1", "Expiry Date": "2020-01-01" } },
        { name: "future-rg", tags: { "iac-submissionId": "sub-2", "Expiry Date": "2099-01-01" } },
        { name: "untagged-rg", tags: { "Expiry Date": "2020-01-01" } },
        { name: "no-expiry-rg", tags: { "iac-submissionId": "sub-3" } },
        { name: "no-tags-rg" },
      ])
    );
    mockBeginDelete.mockResolvedValue({});
    const ctx = makeContext();

    await reapExpiredDeployments({} as never, ctx);

    expect(mockBeginDelete).toHaveBeenCalledOnce();
    expect(mockBeginDelete).toHaveBeenCalledWith("expired-rg");
  });

  it("never touches a resource group without the app's own iac-submissionId tag", async () => {
    mockList.mockReturnValue(
      makeAsyncIterable([
        { name: "someone-elses-rg", tags: { "Expiry Date": "2020-01-01", owner: "another-team" } },
      ])
    );
    const ctx = makeContext();

    await reapExpiredDeployments({} as never, ctx);

    expect(mockBeginDelete).not.toHaveBeenCalled();
  });

  it("logs the error and continues when one delete fails", async () => {
    mockList.mockReturnValue(
      makeAsyncIterable([
        { name: "expired-rg-1", tags: { "iac-submissionId": "sub-1", "Expiry Date": "2020-01-01" } },
        { name: "expired-rg-2", tags: { "iac-submissionId": "sub-2", "Expiry Date": "2020-01-01" } },
      ])
    );
    mockBeginDelete
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({});
    const ctx = makeContext();

    await expect(reapExpiredDeployments({} as never, ctx)).resolves.toBeUndefined();

    expect(mockBeginDelete).toHaveBeenCalledTimes(2);
    expect(ctx.error).toHaveBeenCalledWith(
      expect.stringContaining("Failed to reap expired resource group expired-rg-1")
    );
  });

  it("logs a summary of checked/deleted/errors", async () => {
    mockList.mockReturnValue(
      makeAsyncIterable([
        { name: "expired-rg", tags: { "iac-submissionId": "sub-1", "Expiry Date": "2020-01-01" } },
        { name: "future-rg", tags: { "iac-submissionId": "sub-2", "Expiry Date": "2099-01-01" } },
      ])
    );
    mockBeginDelete.mockResolvedValue({});
    const ctx = makeContext();

    await reapExpiredDeployments({} as never, ctx);

    expect(ctx.log).toHaveBeenCalledWith(
      expect.stringMatching(/checked 2, deleted 1, errors 0/)
    );
  });
});
