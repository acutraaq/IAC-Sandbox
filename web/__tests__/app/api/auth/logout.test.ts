import { describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
  process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
});

describe("POST /api/auth/logout", () => {
  it("clears the session cookie", async () => {
    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toBeTruthy();
    expect(setCookie!).toMatch(/iac_session=/);
    expect(setCookie!).toMatch(/Max-Age=0/i);
  });
});
