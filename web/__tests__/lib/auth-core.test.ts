import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("auth-core", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.SESSION_SECRET = "test_secret_at_least_32_chars_long_xxxxxx";
  });

  afterEach(() => {
    delete process.env.SESSION_SECRET;
  });

  describe("createSessionCookie", () => {
    it("returns a signed cookie string in payload.sig format", async () => {
      const { createSessionCookie } = await import("@/lib/auth-core");
      const user = { upn: "test@example.com", displayName: "Test User" };
      const cookie = await createSessionCookie(user);
      expect(typeof cookie).toBe("string");
      const parts = cookie.split(".");
      expect(parts).toHaveLength(2);
      expect(parts[0].length).toBeGreaterThan(0);
      expect(parts[1].length).toBeGreaterThan(0);
    });

    it("throws when SESSION_SECRET is not set", async () => {
      delete process.env.SESSION_SECRET;
      const { createSessionCookie } = await import("@/lib/auth-core");
      await expect(
        createSessionCookie({ upn: "test@example.com", displayName: "Test User" })
      ).rejects.toThrow();
    });
  });

  describe("verifySessionCookie", () => {
    it("returns user for a valid cookie", async () => {
      const { createSessionCookie, verifySessionCookie } = await import("@/lib/auth-core");
      const user = { upn: "test@example.com", displayName: "Test User" };
      const cookie = await createSessionCookie(user);
      const result = await verifySessionCookie(cookie);
      expect(result).toEqual({ upn: "test@example.com", displayName: "Test User" });
    });

    it("returns null for undefined input", async () => {
      const { verifySessionCookie } = await import("@/lib/auth-core");
      const result = await verifySessionCookie(undefined);
      expect(result).toBeNull();
    });

    it("returns null for null input", async () => {
      const { verifySessionCookie } = await import("@/lib/auth-core");
      const result = await verifySessionCookie(null);
      expect(result).toBeNull();
    });

    it("returns null for empty string", async () => {
      const { verifySessionCookie } = await import("@/lib/auth-core");
      const result = await verifySessionCookie("");
      expect(result).toBeNull();
    });

    it("returns null for tampered cookie", async () => {
      const { createSessionCookie, verifySessionCookie } = await import("@/lib/auth-core");
      const user = { upn: "test@example.com", displayName: "Test User" };
      const cookie = await createSessionCookie(user);
      const tampered = cookie.slice(0, -5) + "xxxxx";
      const result = await verifySessionCookie(tampered);
      expect(result).toBeNull();
    });

    it("returns null for cookie signed with different secret", async () => {
      const { createSessionCookie, verifySessionCookie } = await import("@/lib/auth-core");
      const user = { upn: "test@example.com", displayName: "Test User" };
      const cookie = await createSessionCookie(user);
      process.env.SESSION_SECRET = "another_secret_at_least_32_chars_long_yyy";
      const { verifySessionCookie: verify2 } = await import("@/lib/auth-core");
      const result = await verify2(cookie);
      expect(result).toBeNull();
    });

    it("returns null for malformed cookie (no dot)", async () => {
      const { verifySessionCookie } = await import("@/lib/auth-core");
      const result = await verifySessionCookie("justrandomstringwithoutadot");
      expect(result).toBeNull();
    });
  });
});
