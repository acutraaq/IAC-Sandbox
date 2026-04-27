import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginUser, logoutUser } from "@/lib/api";

beforeEach(() => {
  globalThis.fetch = vi.fn();
});

describe("loginUser", () => {
  it("POSTs to /api/auth/login", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true } as Response);
    await loginUser();
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/auth/login", { method: "POST" });
  });

  it("throws when the response is not ok", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: false, status: 401 } as Response);
    await expect(loginUser()).rejects.toThrow("login failed");
  });
});

describe("logoutUser", () => {
  it("POSTs to /api/auth/logout", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({ ok: true } as Response);
    await logoutUser();
    expect(globalThis.fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
  });
});
