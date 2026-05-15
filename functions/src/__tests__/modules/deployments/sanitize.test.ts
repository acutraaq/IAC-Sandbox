import { describe, it, expect } from "vitest";
import {
  sanitizeStorageName,
  sanitizeKeyVaultName,
  sanitizeGenericName,
} from "../../../modules/deployments/sanitize.js";

describe("sanitizeStorageName", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeStorageName("")).toBe("");
  });
  it("returns empty string for all-special-char input", () => {
    expect(sanitizeStorageName("!!!")).toBe("");
  });
  it("returns empty string for 1-char result", () => {
    expect(sanitizeStorageName("a!!")).toBe("");
  });
  it("returns empty string for 2-char result", () => {
    expect(sanitizeStorageName("ab!")).toBe("");
  });
  it("keeps 3-char result", () => {
    expect(sanitizeStorageName("abc")).toBe("abc");
  });
  it("lowercases and strips non-alphanumeric", () => {
    expect(sanitizeStorageName("My-Storage!")).toBe("mystorage");
  });
  it("truncates to 24 chars", () => {
    expect(sanitizeStorageName("a".repeat(30))).toBe("a".repeat(24));
  });
});

describe("sanitizeKeyVaultName", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeKeyVaultName("")).toBe("");
  });
  it("returns empty string for all-special-char input", () => {
    expect(sanitizeKeyVaultName("!!!")).toBe("");
  });
  it("returns empty string for 1-char result after stripping", () => {
    // "a!!" → replace non-alphanum → "a--" → collapse → "a-" → strip trailing → "a" → length 1 < 3 → ""
    expect(sanitizeKeyVaultName("a!!")).toBe("");
  });
  it("returns empty string for 2-char result after stripping", () => {
    // "ab!" → "ab-" → "ab" → length 2 < 3 → ""
    expect(sanitizeKeyVaultName("ab!")).toBe("");
  });
  it("keeps 3-char result", () => {
    expect(sanitizeKeyVaultName("abc")).toBe("abc");
  });
  it("strips leading non-alpha characters", () => {
    expect(sanitizeKeyVaultName("123vault")).toBe("vault");
  });
  it("returns empty string when input is only digits", () => {
    // "123" → strip leading non-alpha → "" → ""
    expect(sanitizeKeyVaultName("123")).toBe("");
  });
  it("collapses consecutive hyphens", () => {
    expect(sanitizeKeyVaultName("a--b")).toBe("a-b");
  });
  it("strips trailing hyphens", () => {
    expect(sanitizeKeyVaultName("abc---")).toBe("abc");
  });
  it("converts spaces and special chars to hyphens", () => {
    expect(sanitizeKeyVaultName("my vault!")).toBe("my-vault");
  });
  it("truncates to 24 chars", () => {
    expect(sanitizeKeyVaultName("a".repeat(30))).toHaveLength(24);
  });
});

describe("sanitizeGenericName", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeGenericName("", 63)).toBe("");
  });
  it("returns empty string for all-special-char input", () => {
    expect(sanitizeGenericName("!!!", 63)).toBe("");
  });
  it("returns empty string for 1-char result", () => {
    // "a!!" → "a--" → collapse → "a-" → strip trailing → "a" → length 1 < 3 → ""
    expect(sanitizeGenericName("a!!", 63)).toBe("");
  });
  it("returns empty string for 2-char result", () => {
    // "ab!" → "ab-" → strip trailing → "ab" → length 2 < 3 → ""
    expect(sanitizeGenericName("ab!", 63)).toBe("");
  });
  it("keeps 3-char result", () => {
    expect(sanitizeGenericName("abc", 63)).toBe("abc");
  });
  it("converts spaces and special chars to hyphens", () => {
    expect(sanitizeGenericName("My App Name", 63)).toBe("my-app-name");
  });
  it("collapses consecutive hyphens", () => {
    expect(sanitizeGenericName("a--b", 63)).toBe("a-b");
  });
  it("strips leading hyphens", () => {
    expect(sanitizeGenericName("---abc", 63)).toBe("abc");
  });
  it("strips trailing hyphens", () => {
    expect(sanitizeGenericName("abc---", 63)).toBe("abc");
  });
  it("respects maxLen parameter", () => {
    expect(sanitizeGenericName("a".repeat(80), 63).length).toBeLessThanOrEqual(63);
  });
  it("respects smaller maxLen", () => {
    expect(sanitizeGenericName("a".repeat(30), 10).length).toBeLessThanOrEqual(10);
  });
});
