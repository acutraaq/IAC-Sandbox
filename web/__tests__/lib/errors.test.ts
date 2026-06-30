import { describe, it, expect } from "vitest";
import { AppError, toErrorResponse, logError, isArmError } from "@/lib/errors";

describe("AppError", () => {
  it("has correct name, code, statusCode, and message", () => {
    const err = new AppError("NOT_FOUND", "Not here", 404);
    expect(err.name).toBe("AppError");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Not here");
  });

  it("stores optional details", () => {
    const details = [{ path: "field", message: "Required" }];
    const err = new AppError("VALIDATION_ERROR", "Bad", 400, details);
    expect(err.details).toEqual(details);
  });

  it("is instance of Error", () => {
    const err = new AppError("INTERNAL_ERROR", "Oops", 500);
    expect(err).toBeInstanceOf(Error);
  });

  describe("factory methods", () => {
    it("notFound defaults status to 404", () => {
      const err = AppError.notFound();
      expect(err.code).toBe("NOT_FOUND");
      expect(err.statusCode).toBe(404);
    });

    it("notFound accepts custom message", () => {
      const err = AppError.notFound("Gone");
      expect(err.message).toBe("Gone");
    });

    it("validation creates error with details", () => {
      const details = [{ path: "email", message: "Invalid" }];
      const err = AppError.validation("Bad data", details);
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.statusCode).toBe(400);
      expect(err.details).toEqual(details);
    });

    it("internal defaults status to 500", () => {
      const err = AppError.internal();
      expect(err.code).toBe("INTERNAL_ERROR");
      expect(err.statusCode).toBe(500);
    });

    it("forbidden defaults status to 403", () => {
      const err = AppError.forbidden("Blocked");
      expect(err.code).toBe("FORBIDDEN");
      expect(err.statusCode).toBe(403);
      expect(err.message).toBe("Blocked");
    });

    it("unauthorized defaults status to 401", () => {
      const err = AppError.unauthorized();
      expect(err.code).toBe("UNAUTHORIZED");
      expect(err.statusCode).toBe(401);
    });

    it("unauthorized accepts custom message", () => {
      const err = AppError.unauthorized("No access");
      expect(err.message).toBe("No access");
    });
  });
});

describe("toErrorResponse", () => {
  it("returns structured error body", () => {
    const err = AppError.forbidden("Nope");
    const body = toErrorResponse(err, "req_001");
    expect(body).toEqual({
      error: { code: "FORBIDDEN", message: "Nope" },
      requestId: "req_001",
    });
  });

  it("includes details when present", () => {
    const details = [{ path: "slug", message: "Required" }];
    const err = AppError.validation("Bad", details);
    const body = toErrorResponse(err, "req_002");
    expect(body.error.details).toEqual(details);
  });

  it("omits details when empty", () => {
    const err = AppError.notFound();
    const body = toErrorResponse(err, "req_003");
    expect(body.error).not.toHaveProperty("details");
  });
});

describe("logError", () => {
  it("does not throw for any input", () => {
    expect(() => logError("/test", "r1", new Error("boom"))).not.toThrow();
    expect(() => logError("/test", "r2", "string error")).not.toThrow();
    expect(() => logError("/test", "r3", null)).not.toThrow();
  });
});

describe("isArmError", () => {
  it("returns true for objects with numeric statusCode", () => {
    expect(isArmError({ statusCode: 404 })).toBe(true);
    expect(isArmError({ statusCode: 200, body: "{}" })).toBe(true);
  });

  it("returns false for objects without numeric statusCode", () => {
    expect(isArmError({})).toBe(false);
    expect(isArmError({ statusCode: "404" })).toBe(false);
  });

  it("returns false for non-objects", () => {
    expect(isArmError(null)).toBe(false);
    expect(isArmError(undefined)).toBe(false);
    expect(isArmError(404)).toBe(false);
    expect(isArmError("error")).toBe(false);
  });
});
