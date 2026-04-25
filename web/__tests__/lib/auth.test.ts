import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
});

async function load() {
  return await import("@/lib/auth");
}

describe("auth: createSessionCookie / verifySessionCookie", () => {
  it("round-trips a valid user", async () => {
    const { createSessionCookie, verifySessionCookie } = await load();
    const value = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const session = await verifySessionCookie(value);
    expect(session?.upn).toBe("demo@sandbox.local");
    expect(session?.displayName).toBe("Demo User");
  });

  it("rejects a tampered payload", async () => {
    const { createSessionCookie, verifySessionCookie } = await load();
    const value = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const [, sig] = value.split(".");
    const tampered =
      btoa('{"upn":"attacker@evil.com","displayName":"x","exp":' +
        (Math.floor(Date.now() / 1000) + 3600) + "}")
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") +
      "." + sig;
    expect(await verifySessionCookie(tampered)).toBeNull();
  });

  it("rejects a malformed cookie (no dot)", async () => {
    const { verifySessionCookie } = await load();
    expect(await verifySessionCookie("not-a-cookie")).toBeNull();
  });

  it("rejects an expired cookie", async () => {
    process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
    const { _signForTest, verifySessionCookie } = await load() as typeof import("@/lib/auth") & {
      _signForTest: (payloadJson: string) => Promise<string>;
    };
    const expired = JSON.stringify({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
      exp: Math.floor(Date.now() / 1000) - 1,
    });
    const value = await _signForTest(expired);
    expect(await verifySessionCookie(value)).toBeNull();
  });

  it("rejects a cookie signed with a different secret", async () => {
    const { createSessionCookie } = await load();
    const value = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    process.env.SESSION_SECRET = "different_secret_at_least_32_chars_yyyyy";
    vi.resetModules();
    const { verifySessionCookie } = await import("@/lib/auth");
    expect(await verifySessionCookie(value)).toBeNull();
  });
});

describe("auth: SESSION_COOKIE_NAME", () => {
  it("exports a stable cookie name", async () => {
    const { SESSION_COOKIE_NAME } = await load();
    expect(SESSION_COOKIE_NAME).toBe("iac_session");
  });
});

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("auth: getCurrentUser", () => {
  it("returns null when no session cookie is present", async () => {
    const { cookies } = await import("next/headers");
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      get: () => undefined,
    });
    const { getCurrentUser } = await load();
    expect(await getCurrentUser()).toBeNull();
  });

  it("returns the session user when a valid cookie is present", async () => {
    const { createSessionCookie } = await load();
    const value = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const { cookies } = await import("next/headers");
    (cookies as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      get: (name: string) =>
        name === "iac_session" ? { name, value } : undefined,
    });
    const { getCurrentUser } = await load();
    const user = await getCurrentUser();
    expect(user).toEqual({ upn: "demo@sandbox.local", displayName: "Demo User" });
  });
});
