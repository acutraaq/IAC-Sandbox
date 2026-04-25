import { describe, expect, it } from "vitest";
import { deploymentPayloadSchema } from "./schema.js";

const validTags = {
  "Cost Center": "CC-001",
  "Project ID": "PRJ-001",
  "Project Owner": "owner@epf.gov.my",
  "Expiry Date": "2026-12-31",
};

describe("deploymentPayloadSchema", () => {
  it("accepts valid template payloads", () => {
    const result = deploymentPayloadSchema.safeParse({
      mode: "template",
      tags: validTags,
      template: {
        slug: "storage-account",
        formValues: {
          storageAccountName: "mystorage",
          region: "southeastasia",
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it("accepts valid custom payloads", () => {
    const result = deploymentPayloadSchema.safeParse({
      mode: "custom",
      tags: validTags,
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
      tags: validTags,
      resources: [],
    });

    expect(result.success).toBe(false);
  });

  it("rejects template payloads with empty slug", () => {
    const result = deploymentPayloadSchema.safeParse({
      mode: "template",
      tags: validTags,
      template: {
        slug: "",
        formValues: {},
      },
    });

    expect(result.success).toBe(false);
  });
});
