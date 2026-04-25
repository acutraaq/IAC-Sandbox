import { describe, it, expect } from "vitest";
import {
  deriveResourceGroupName,
  deriveLocation,
  sanitise,
} from "@/lib/deployments/rg-name";

const validTags = {
  "Cost Center": "CC-001",
  "Project ID": "PRJ-001",
  "Project Owner": "owner@epf.gov.my",
  "Expiry Date": "2026-12-31",
};

describe("sanitise", () => {
  it("lowercases and trims the name", () => {
    expect(sanitise("MyStorage")).toBe("mystorage");
  });

  it("replaces spaces with hyphens", () => {
    expect(sanitise("my storage account")).toBe("my-storage-account");
  });

  it("removes disallowed characters", () => {
    expect(sanitise("my@storage!")).toBe("mystorage");
  });

  it("removes leading non-alphanumeric characters", () => {
    expect(sanitise("---my-resource")).toBe("my-resource");
  });

  it("truncates to 87 characters", () => {
    const long = "a".repeat(100);
    expect(sanitise(long)).toHaveLength(87);
  });

  it("returns 'sandbox' for empty input", () => {
    expect(sanitise("")).toBe("sandbox");
  });

  it("returns 'sandbox' for input that sanitises to empty", () => {
    expect(sanitise("!!!")).toBe("sandbox");
  });
});

describe("deriveResourceGroupName", () => {
  it("uses primary field value for template mode", () => {
    const result = deriveResourceGroupName({
      mode: "template",
      template: { slug: "storage-account", formValues: { storageName: "mydata" } },
    });
    expect(result).toBe("mydata-rg");
  });

  it("falls back to slug when primary field is missing", () => {
    const result = deriveResourceGroupName({
      mode: "template",
      template: { slug: "storage-account", formValues: {} },
    });
    expect(result).toBe("storage-account-rg");
  });

  it("uses first resource name for custom mode", () => {
    const result = deriveResourceGroupName({
      mode: "custom",
      resources: [
        { type: "Microsoft.KeyVault/vaults", name: "My Vault", icon: "KeyRound", config: {} },
      ],
    });
    expect(result).toBe("my-vault-rg");
  });

  it("falls back to 'sandbox-rg' for custom mode with no resources", () => {
    const result = deriveResourceGroupName({
      mode: "custom",
      resources: [],
    });
    expect(result).toBe("sandbox-rg");
  });
});

describe("deriveLocation", () => {
  it("returns region from template formValues", () => {
    const result = deriveLocation({
      mode: "template",
      tags: validTags,
      template: { slug: "storage-account", formValues: { region: "malaysiasouth" } },
    });
    expect(result).toBe("malaysiasouth");
  });

  it("defaults to southeastasia for template mode with no region", () => {
    const result = deriveLocation({
      mode: "template",
      tags: validTags,
      template: { slug: "storage-account", formValues: {} },
    });
    expect(result).toBe("southeastasia");
  });

  it("returns region from first resource config for custom mode", () => {
    const result = deriveLocation({
      mode: "custom",
      tags: validTags,
      resources: [
        { type: "Microsoft.Storage/storageAccounts", name: "store", icon: "Database", config: { region: "eastasia" } },
      ],
    });
    expect(result).toBe("eastasia");
  });

  it("defaults to southeastasia for custom mode with no region", () => {
    const result = deriveLocation({
      mode: "custom",
      tags: validTags,
      resources: [
        { type: "Microsoft.Storage/storageAccounts", name: "store", icon: "Database", config: {} },
      ],
    });
    expect(result).toBe("southeastasia");
  });
});
