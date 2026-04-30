import { describe, it, expect, vi, beforeEach } from "vitest";
import { logoutUser } from "@/lib/api";

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

describe("logoutUser", () => {
  it("POSTs to /api/auth/logout", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true } as Response);
    await logoutUser();
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
  });
});
