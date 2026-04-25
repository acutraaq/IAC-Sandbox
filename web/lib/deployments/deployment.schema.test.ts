import { describe, expect, it } from "vitest";
import { deploymentPayloadSchema } from "./deployment.schema.js";

describe("deploymentPayloadSchema", () => {
  it("accepts valid template payloads", () => {
    const result = deploymentPayloadSchema.safeParse({
      mode: "template",
      template: {
        slug: "web-application",
        formValues: {
          appName: "my-app",
          region: "southeastasia",
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid custom payloads", () => {
    const result = deploymentPayloadSchema.safeParse({
      mode: "custom",
      resources: [
        {
          type: "Microsoft.KeyVault/vaults",
          name: "Secret Manager",
          icon: "KeyRound",
          config: {
            vaultName: "my-secrets",
          },
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects custom payloads with empty resources", () => {
    const result = deploymentPayloadSchema.safeParse({
      mode: "custom",
      resources: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects template payloads with empty slug", () => {
    const result = deploymentPayloadSchema.safeParse({
      mode: "template",
      template: {
        slug: "",
        formValues: {},
      },
    });

    expect(result.success).toBe(false);
  });
});
