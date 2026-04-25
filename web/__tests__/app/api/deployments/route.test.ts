import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/deployments/route";

vi.mock("@/lib/server-env", () => ({
  serverEnv: {
    AZURE_SUBSCRIPTION_ID: "test-sub-id",
    AZURE_TENANT_ID: "test-tenant-id",
    AZURE_STORAGE_CONNECTION_STRING: "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net",
  },
}));

const mockSendMessage = vi.fn().mockResolvedValue({});
vi.mock("@azure/storage-queue", () => ({
  QueueServiceClient: {
    fromConnectionString: vi.fn(() => ({
      getQueueClient: vi.fn(() => ({ sendMessage: mockSendMessage })),
    })),
  },
}));

const validPayload = {
  mode: "template",
  tags: {
    "Cost Center": "CC-001",
    "Project ID": "PRJ-001",
    "Project Owner": "owner@epf.gov.my",
    "Expiry Date": "2026-12-31",
  },
  template: { slug: "storage-account", formValues: { storageName: "mystorage", region: "southeastasia" } },
};

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/deployments", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/deployments", () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
  });

  it("returns 201 with submissionId and resourceGroup on valid payload", async () => {
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.submissionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
    expect(body.resourceGroup).toBeTruthy();
  });

  it("enqueues a base64-encoded message", async () => {
    await POST(makeRequest(validPayload));
    expect(mockSendMessage).toHaveBeenCalledOnce();
    const [encoded] = mockSendMessage.mock.calls[0] as [string];
    const decoded = JSON.parse(Buffer.from(encoded, "base64").toString());
    expect(decoded.payload.mode).toBe("template");
  });

  it("returns 400 for missing required tags", async () => {
    const res = await POST(makeRequest({ mode: "template", template: { slug: "storage-account", formValues: {} } }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost/api/deployments", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 403 for policy-blocked slugs", async () => {
    const res = await POST(makeRequest({
      ...validPayload,
      template: { slug: "virtual-machine", formValues: {} },
    }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 500 when queue send fails", async () => {
    mockSendMessage.mockRejectedValueOnce(new Error("queue unavailable"));
    const res = await POST(makeRequest(validPayload));
    expect(res.status).toBe(500);
  });
});
