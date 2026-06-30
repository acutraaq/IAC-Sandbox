import { describe, it, expect, vi } from "vitest";

const baseEnv = {
  NODE_ENV: "test",
  AZURE_SUBSCRIPTION_ID: "00000000-0000-0000-0000-000000000000",
  AZURE_TENANT_ID: "00000000-0000-0000-0000-000000000000",
  DEPLOYMENT_QUEUE: "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=FQ==",
  AZURE_STORAGE_CONNECTION_STRING: "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=FQ==",
};

function clearEnv() {
  for (const key of Object.keys(baseEnv)) delete process.env[key];
}

describe("functions/src/lib/env", () => {
  it("parses successfully with all required variables set", async () => {
    vi.resetModules();
    clearEnv();
    Object.assign(process.env, baseEnv);
    const { default: env } = await import("../../lib/env.js");
    expect(env.AZURE_SUBSCRIPTION_ID).toBe(baseEnv.AZURE_SUBSCRIPTION_ID);
    expect(env.NODE_ENV).toBe("test");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("defaults NODE_ENV to development when unset", async () => {
    vi.resetModules();
    clearEnv();
    const vars = { ...baseEnv };
    delete (vars as Record<string, unknown>).NODE_ENV;
    Object.assign(process.env, vars);
    const { default: env } = await import("../../lib/env.js");
    expect(env.NODE_ENV).toBe("development");
  });

  it("throws when AZURE_SUBSCRIPTION_ID is missing", async () => {
    vi.resetModules();
    clearEnv();
    const vars = { ...baseEnv };
    delete (vars as Record<string, unknown>).AZURE_SUBSCRIPTION_ID;
    Object.assign(process.env, vars);
    const { default: env } = await import("../../lib/env.js");
    expect(() => env.AZURE_SUBSCRIPTION_ID).toThrow(
      "Invalid environment variables"
    );
  });

  it("throws when AZURE_STORAGE_CONNECTION_STRING is empty", async () => {
    vi.resetModules();
    clearEnv();
    Object.assign(process.env, { ...baseEnv, AZURE_STORAGE_CONNECTION_STRING: "" });
    const { default: env } = await import("../../lib/env.js");
    expect(() => env.AZURE_STORAGE_CONNECTION_STRING).toThrow(
      "Invalid environment variables"
    );
  });
});
