import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSessionCookie } from "@/lib/auth";

beforeEach(() => {
  process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxx";
});

function makeReq(url: string, cookies: Record<string, string> = {}) {
  const req = new NextRequest(new URL(url, "http://localhost:3000"));
  for (const [k, v] of Object.entries(cookies)) req.cookies.set(k, v);
  return req;
}

describe("proxy", () => {
  it("redirects an unauthenticated user from /templates to /login?next=/templates", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates"));
    expect(res.status).toBe(307);
    const loc = res.headers.get("location");
    expect(loc).toMatch(/\/login\?next=%2Ftemplates$/);
  });

  it("preserves query string when redirecting", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates?cat=compute"));
    const loc = res.headers.get("location")!;
    expect(decodeURIComponent(loc)).toContain("next=/templates?cat=compute");
  });

  it("does NOT redirect when a valid session cookie is present", async () => {
    const cookieValue = await createSessionCookie({
      upn: "demo@sandbox.local",
      displayName: "Demo User",
    });
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates", { iac_session: cookieValue }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("does NOT redirect when path is /login", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/login"));
    expect(res.status).toBe(200);
  });

  it("redirects to /login when session cookie is invalid", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/", { iac_session: "garbage.value" }));
    expect(res.status).toBe(307);
  });
});
