import { describe, it, expect, vi, beforeEach } from "vitest";

process.env.AZURE_SUBSCRIPTION_ID ??= "11111111-1111-1111-1111-111111111111";
process.env.AZURE_TENANT_ID ??= "22222222-2222-2222-2222-222222222222";
process.env.DEPLOYMENT_QUEUE ??= "test-queue";
process.env.AZURE_STORAGE_CONNECTION_STRING ??= "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==;EndpointSuffix=core.windows.net";
process.env.NODE_ENV = "test";

const mockGetToken = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock("@azure/functions", () => ({
  app: { http: vi.fn() },
}));

vi.mock("@azure/identity", () => ({
  DefaultAzureCredential: vi.fn().mockImplementation(function () {
    return { getToken: mockGetToken };
  }),
}));

const { healthz } = await import("../../functions/healthz.js");

function makeContext() {
  return {
    log: vi.fn(),
    error: vi.fn(),
  } as unknown as import("@azure/functions").InvocationContext;
}

function makeRequest(): import("@azure/functions").HttpRequest {
  return {} as import("@azure/functions").HttpRequest;
}

describe("healthz", () => {
  beforeEach(() => {
    mockGetToken.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal("fetch", mockFetch);
  });

  it("returns 200 with mi: true when token + ARM probe succeed", async () => {
    mockGetToken.mockResolvedValue({
      token: "fake-token",
      expiresOnTimestamp: Date.now() + 60_000,
    });
    mockFetch.mockResolvedValue({ ok: true, status: 200 });

    const res = await healthz(makeRequest(), makeContext());
    expect(res.status).toBe(200);
    expect(res.jsonBody).toEqual({ status: "ok", mi: true });
  });

  it("returns 503 when token acquisition fails", async () => {
    mockGetToken.mockRejectedValue(new Error("ManagedIdentity not available"));

    const res = await healthz(makeRequest(), makeContext());
    expect(res.status).toBe(503);
    expect(res.jsonBody).toEqual({
      status: "error",
      detail: "ManagedIdentity not available",
    });
  });

  it("returns 503 when token response is empty", async () => {
    mockGetToken.mockResolvedValue(null);

    const res = await healthz(makeRequest(), makeContext());
    expect(res.status).toBe(503);
    expect(res.jsonBody).toEqual({
      status: "error",
      detail: "Token acquisition returned empty token",
    });
  });

  it("returns 503 when ARM probe returns non-OK", async () => {
    mockGetToken.mockResolvedValue({
      token: "fake-token",
      expiresOnTimestamp: Date.now() + 60_000,
    });
    mockFetch.mockResolvedValue({ ok: false, status: 403, text: async () => "Forbidden" });

    const res = await healthz(makeRequest(), makeContext());
    expect(res.status).toBe(503);
    expect(res.jsonBody.detail).toContain("403");
  });
});
