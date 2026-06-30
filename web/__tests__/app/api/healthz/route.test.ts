import { describe, it, expect } from "vitest";
import { NextResponse } from "next/server";

async function getHealthzGET() {
  const mod = await import("@/app/api/healthz/route");
  return mod.GET();
}

describe("GET /api/healthz", () => {
  it("returns 200 with status ok", async () => {
    const res = await getHealthzGET();
    expect(res).toBeInstanceOf(NextResponse);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
    expect(res.status).toBe(200);
  });
});
