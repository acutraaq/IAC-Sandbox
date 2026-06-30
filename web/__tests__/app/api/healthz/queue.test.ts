import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { QueueServiceClient } from "@azure/storage-queue";

vi.mock("@azure/storage-queue", () => {
  const actual = vi.importActual("@azure/storage-queue");
  return {
    ...actual,
    QueueServiceClient: {
      fromConnectionString: vi.fn(),
    },
  };
});

vi.mock("@/lib/server-env", () => ({
  serverEnv: {
    AZURE_STORAGE_CONNECTION_STRING: "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==;EndpointSuffix=core.windows.net",
    AZURE_SUBSCRIPTION_ID: "00000000-0000-0000-0000-000000000000",
    AZURE_TENANT_ID: "00000000-0000-0000-0000-000000000000",
    SESSION_SECRET: "test_secret_at_least_32_chars_long_xxxxxx",
  },
}));

function mockQueueClient(approximateCount: number, exists = true) {
  return {
    getProperties: vi.fn().mockResolvedValue({ approximateMessagesCount: approximateCount }),
  };
}

function mockQueueClient404() {
  const err = Object.assign(new Error("Queue not found"), { statusCode: 404 });
  return {
    getProperties: vi.fn().mockRejectedValue(err),
  };
}

describe("GET /api/healthz/queue", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns ok with empty queues", async () => {
    const { QueueServiceClient } = await import("@azure/storage-queue");
    vi.mocked(QueueServiceClient.fromConnectionString).mockReturnValue({
      getQueueClient: vi.fn((name: string) =>
        name.includes("poison") ? mockQueueClient(0) : mockQueueClient(0)
      ),
    } as unknown as QueueServiceClient);

    const mod = await import("@/app/api/healthz/queue/route");
    const res = await mod.GET();
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.queues["deployment-jobs"].approximateMessagesCount).toBe(0);
    expect(body.queues["deployment-jobs-poison"].approximateMessagesCount).toBe(0);
    expect(body.diagnosis).toContain("healthy");
  });

  it("detects stuck messages in main queue", async () => {
    const { QueueServiceClient } = await import("@azure/storage-queue");
    vi.mocked(QueueServiceClient.fromConnectionString).mockReturnValue({
      getQueueClient: vi.fn((name: string) =>
        name.includes("poison") ? mockQueueClient(0) : mockQueueClient(5)
      ),
    } as unknown as QueueServiceClient);

    const mod = await import("@/app/api/healthz/queue/route");
    const res = await mod.GET();
    const body = await res.json();
    expect(body.queues["deployment-jobs"].approximateMessagesCount).toBe(5);
    expect(body.diagnosis).toContain("NOT being consumed");
  });

  it("detects poison queue messages", async () => {
    const { QueueServiceClient } = await import("@azure/storage-queue");
    vi.mocked(QueueServiceClient.fromConnectionString).mockReturnValue({
      getQueueClient: vi.fn((name: string) =>
        name.includes("poison") ? mockQueueClient(3) : mockQueueClient(0)
      ),
    } as unknown as QueueServiceClient);

    const mod = await import("@/app/api/healthz/queue/route");
    const res = await mod.GET();
    const body = await res.json();
    expect(body.queues["deployment-jobs-poison"].approximateMessagesCount).toBe(3);
    expect(body.diagnosis).toContain("threw on every retry");
  });

  it("handles 404 for non-existent queue", async () => {
    const { QueueServiceClient } = await import("@azure/storage-queue");
    vi.mocked(QueueServiceClient.fromConnectionString).mockReturnValue({
      getQueueClient: vi.fn(() => mockQueueClient404()),
    } as unknown as QueueServiceClient);

    const mod = await import("@/app/api/healthz/queue/route");
    const res = await mod.GET();
    const body = await res.json();
    expect(body.queues["deployment-jobs"].exists).toBe(false);
    expect(body.status).toBe("ok");
  });

  it("returns 503 when connection string is invalid", async () => {
    const { QueueServiceClient } = await import("@azure/storage-queue");
    vi.mocked(QueueServiceClient.fromConnectionString).mockImplementation(() => {
      throw new Error("Invalid connection string");
    });

    const mod = await import("@/app/api/healthz/queue/route");
    const res = await mod.GET();
    const body = await res.json();
    expect(body.status).toBe("error");
    expect(res.status).toBe(503);
  });
});
