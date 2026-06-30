import { describe, it, expect, vi, beforeEach } from "vitest";

const { getTokenMock, MockCredential } = vi.hoisted(() => {
  const fn = vi.fn();
  class MockCred {
    getToken = fn;
  }
  return { getTokenMock: fn, MockCredential: MockCred };
});

vi.mock("@azure/identity", () => ({
  DefaultAzureCredential: MockCredential,
}));

vi.mock("@/lib/server-env", () => ({
  serverEnv: {
    AZURE_SUBSCRIPTION_ID: "00000000-0000-0000-0000-000000000000",
    AZURE_TENANT_ID: "00000000-0000-0000-0000-000000000000",
    AZURE_STORAGE_CONNECTION_STRING: "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==;EndpointSuffix=core.windows.net",
    SESSION_SECRET: "test_secret_at_least_32_chars_long_xxxxxx",
  },
}));

describe("GET /api/healthz/arm", () => {
  beforeEach(async () => {
    vi.resetModules();
    getTokenMock.mockReset();
    globalThis.fetch = vi.fn();
  });

  it("returns ok when ARM responds successfully", async () => {
    getTokenMock.mockResolvedValue({ token: "t" });
    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true, status: 200 } as Response);

    const mod = await import("@/app/api/healthz/arm/route");
    const res = await mod.GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
  });

  it("returns 503 when ARM responds with an error", async () => {
    getTokenMock.mockResolvedValue({ token: "t" });
    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: false, status: 500, text: async () => "err" } as Response);

    const mod = await import("@/app/api/healthz/arm/route");
    const res = await mod.GET();
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.status).toBe("error");
  });
});
