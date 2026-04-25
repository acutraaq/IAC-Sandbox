import { describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
  process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
});

describe("POST /api/auth/login", () => {
  it("sets the session cookie and returns the user", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie!).toMatch(/iac_session=/);
    expect(setCookie!).toMatch(/HttpOnly/i);
    expect(setCookie!).toMatch(/SameSite=lax/i);
    expect(setCookie!).toMatch(/Path=\//);
  });
});
