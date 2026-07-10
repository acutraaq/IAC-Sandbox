import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";

beforeEach(() => {
  process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
});

function makeReq(url: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(url, "http://localhost:3000"));
  for (const [k, v] of Object.entries(cookies)) req.cookies.set(k, v);
  return req;
}

describe("proxy", () => {
  it("redirects unauthenticated requests to /login", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates"));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?next=%2Ftemplates");
  });

  it("redirects requests with query strings preserving the path", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates?cat=compute"));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?next=%2Ftemplates%3Fcat%3Dcompute");
  });

  it("passes through requests with a valid session cookie", async () => {
    const { createSessionCookie } = await import("@/lib/auth-core");
    const value = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates", { iac_session: value }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("passes through /login", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/login"));
    expect(res.status).toBe(200);
  });

  it("redirects requests with an invalid session cookie", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/", { iac_session: "garbage.value" }));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?next=%2F");
  });

  it("fails closed to /login instead of crashing when SESSION_SECRET is invalid", async () => {
    process.env.SESSION_SECRET = "short";
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/", { iac_session: "abcd.efgh" }));
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?next=%2F");
  });
});
