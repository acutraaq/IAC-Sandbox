import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const acquireTokenByCodeMock = vi.fn();
const decodePendingStateMock = vi.fn();

vi.mock("@/lib/msal", () => ({
  decodePendingState: decodePendingStateMock,
  acquireTokenByCode: acquireTokenByCodeMock,
  AUTH_STATE_COOKIE: "iac_auth_pending",
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
});

function makeRequest(url: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(url, "http://localhost:3000"));
  for (const [k, v] of Object.entries(cookies)) req.cookies.set(k, v);
  return req;
}

describe("GET /api/auth/callback", () => {
  it("creates a session cookie and redirects to the stored next path on success", async () => {
    decodePendingStateMock.mockReturnValue({
      state: "state-abc",
      verifier: "verifier-xyz",
      next: "/templates",
    });
    acquireTokenByCodeMock.mockResolvedValue({
      account: { username: "user@epf.gov.my", name: "Test User" },
    });

    const { GET } = await import("@/app/api/auth/callback/route");
    const req = makeRequest(
      "http://localhost:3000/api/auth/callback?code=auth-code-123&state=state-abc",
      { iac_auth_pending: "mock-pending-value" }
    );
    const res = await GET(req);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/\/templates/);
    const setCookie = res.headers.get("set-cookie")!;
    expect(setCookie).toMatch(/iac_session=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Max-Age=86400/i);
  });

  it("clears the iac_auth_pending cookie in the success response", async () => {
    decodePendingStateMock.mockReturnValue({
      state: "state-abc",
      verifier: "verifier-xyz",
      next: "/",
    });
    acquireTokenByCodeMock.mockResolvedValue({
      account: { username: "user@epf.gov.my", name: "Test User" },
    });

    const { GET } = await import("@/app/api/auth/callback/route");
    const req = makeRequest(
      "http://localhost:3000/api/auth/callback?code=auth-code&state=state-abc",
      { iac_auth_pending: "mock" }
    );
    const res = await GET(req);

    const allCookies = res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie") ?? ""];
    const pendingClear = allCookies.find((c) => c.startsWith("iac_auth_pending="));
    expect(pendingClear).toMatch(/Max-Age=0/i);
  });

  it("redirects to /login when the state cookie is missing", async () => {
    decodePendingStateMock.mockReturnValue(null);
    const { GET } = await import("@/app/api/auth/callback/route");
    const req = makeRequest(
      "http://localhost:3000/api/auth/callback?code=auth-code&state=state-abc"
    );
    const res = await GET(req);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/\/login/);
  });

  it("redirects to /login when the OAuth state does not match", async () => {
    decodePendingStateMock.mockReturnValue({
      state: "expected-state",
      verifier: "v",
      next: "/",
    });
    const { GET } = await import("@/app/api/auth/callback/route");
    const req = makeRequest(
      "http://localhost:3000/api/auth/callback?code=auth-code&state=different-state",
      { iac_auth_pending: "mock" }
    );
    const res = await GET(req);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/\/login/);
  });

  it("redirects to /login when MSAL token exchange throws", async () => {
    decodePendingStateMock.mockReturnValue({
      state: "state-abc",
      verifier: "v",
      next: "/",
    });
    acquireTokenByCodeMock.mockRejectedValue(new Error("MSAL failure"));
    const { GET } = await import("@/app/api/auth/callback/route");
    const req = makeRequest(
      "http://localhost:3000/api/auth/callback?code=auth-code&state=state-abc",
      { iac_auth_pending: "mock" }
    );
    const res = await GET(req);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toMatch(/\/login/);
  });

  it("passes the redirect URI derived from the request origin to acquireTokenByCode", async () => {
    decodePendingStateMock.mockReturnValue({
      state: "state-abc",
      verifier: "verifier-xyz",
      next: "/",
    });
    acquireTokenByCodeMock.mockResolvedValue({
      account: { username: "user@epf.gov.my", name: "Test User" },
    });

    const { GET } = await import("@/app/api/auth/callback/route");
    const req = makeRequest(
      "http://localhost:3000/api/auth/callback?code=auth-code&state=state-abc",
      { iac_auth_pending: "mock" }
    );
    await GET(req);
    expect(acquireTokenByCodeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUri: "http://localhost:3000/api/auth/callback",
        code: "auth-code",
        codeVerifier: "verifier-xyz",
      })
    );
  });
});
