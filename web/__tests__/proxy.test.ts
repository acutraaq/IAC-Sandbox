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
  it("passes through unauthenticated requests while SSO is on hold", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("passes through requests with query strings", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates?cat=compute"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("passes through requests with a valid session cookie", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/templates", { iac_session: "any.value" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("passes through /login", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/login"));
    expect(res.status).toBe(200);
  });

  it("passes through requests with an invalid session cookie", async () => {
    const { proxy } = await import("@/proxy");
    const res = await proxy(makeReq("/", { iac_session: "garbage.value" }));
    expect(res.status).toBe(200);
  });
});
