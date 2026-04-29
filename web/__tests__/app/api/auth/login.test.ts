import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const buildAuthCodeUrlMock = vi
  .fn()
  .mockResolvedValue("https://login.microsoftonline.com/mock-auth-url");

vi.mock("@/lib/msal", () => ({
  generatePkce: vi
    .fn()
    .mockReturnValue({ verifier: "test-verifier-32bytes-aaaaaa", challenge: "test-challenge" }),
  buildAuthCodeUrl: buildAuthCodeUrlMock,
  encodePendingState: vi.fn().mockReturnValue("mock-encoded-pending"),
  AUTH_STATE_COOKIE: "iac_auth_pending",
  AUTH_STATE_TTL_SECONDS: 300,
}));

beforeEach(() => {
  vi.clearAllMocks();
  buildAuthCodeUrlMock.mockResolvedValue("https://login.microsoftonline.com/mock-auth-url");
});

describe("GET /api/auth/login", () => {
  it("redirects to the Microsoft auth URL", async () => {
    const { GET } = await import("@/app/api/auth/login/route");
    const req = new NextRequest(
      new URL("http://localhost:3000/api/auth/login?next=/templates")
    );
    const res = await GET(req);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe(
      "https://login.microsoftonline.com/mock-auth-url"
    );
  });

  it("sets the iac_auth_pending cookie with HttpOnly and 5-min TTL", async () => {
    const { GET } = await import("@/app/api/auth/login/route");
    const req = new NextRequest(
      new URL("http://localhost:3000/api/auth/login?next=/templates")
    );
    const res = await GET(req);
    const setCookie = res.headers.get("set-cookie")!;
    expect(setCookie).toMatch(/iac_auth_pending=/);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/Max-Age=300/i);
  });

  it("passes the redirect URI derived from the request origin to buildAuthCodeUrl", async () => {
    const { GET } = await import("@/app/api/auth/login/route");
    const req = new NextRequest(
      new URL("http://localhost:3000/api/auth/login?next=/templates")
    );
    await GET(req);
    expect(buildAuthCodeUrlMock).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUri: "http://localhost:3000/api/auth/callback",
      })
    );
  });

  it("sanitizes an unsafe next param to /", async () => {
    const { encodePendingState } = await import("@/lib/msal");
    const { GET } = await import("@/app/api/auth/login/route");
    const req = new NextRequest(
      new URL("http://localhost:3000/api/auth/login?next=//evil.com")
    );
    await GET(req);
    expect(encodePendingState).toHaveBeenCalledWith(
      expect.objectContaining({ next: "/" })
    );
  });
});
