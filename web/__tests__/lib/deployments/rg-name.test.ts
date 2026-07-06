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

  it("truncates to fit within limit", () => {
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
      template: { slug: "approval-workflow", formValues: { workflowName: "mydata" } },
    });
    expect(result).toBe("mydata-rg");
  });

  it("falls back to slug when primary field is missing", () => {
    const result = deriveResourceGroupName({
      mode: "template",
      template: { slug: "approval-workflow", formValues: {} },
    });
    expect(result).toBe("approval-workflow-rg");
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

  it("appends submissionId suffix when provided", () => {
    const result = deriveResourceGroupName(
      {
        mode: "template",
        template: { slug: "approval-workflow", formValues: { workflowName: "mydata" } },
      },
      "123e4567-e89b-12d3-a456-426614174000"
    );
    expect(result).toBe("mydata-123e45-rg");
  });

  it("total length does not exceed 90 characters", () => {
    const result = deriveResourceGroupName(
      {
        mode: "template",
        template: { slug: "approval-workflow", formValues: { workflowName: "a".repeat(100) } },
      },
      "123e4567-e89b-12d3-a456-426614174000"
    );
    expect(result.length).toBeLessThanOrEqual(90);
  });
});

describe("deriveLocation", () => {
  it("returns malaysiawest regardless of template formValues region", () => {
    const result = deriveLocation({
      mode: "template",
      tags: validTags,
      template: { slug: "approval-workflow", formValues: { region: "southeastasia" } },
    });
    expect(result).toBe("malaysiawest");
  });

  it("defaults to malaysiawest for template mode with no region", () => {
    const result = deriveLocation({
      mode: "template",
      tags: validTags,
      template: { slug: "approval-workflow", formValues: {} },
    });
    expect(result).toBe("malaysiawest");
  });

  it("returns malaysiawest regardless of custom mode resource config region", () => {
    const result = deriveLocation({
      mode: "custom",
      tags: validTags,
      resources: [
        { type: "Microsoft.Web/staticSites", name: "store", icon: "Database", config: { region: "southeastasia" } },
      ],
    });
    expect(result).toBe("malaysiawest");
  });

  it("defaults to malaysiawest for custom mode with no region", () => {
    const result = deriveLocation({
      mode: "custom",
      tags: validTags,
      resources: [
        { type: "Microsoft.Web/staticSites", name: "store", icon: "Database", config: {} },
      ],
    });
    expect(result).toBe("malaysiawest");
  });

  it("clamps disallowed region to malaysiawest", () => {
    const result = deriveLocation({
      mode: "template",
      tags: validTags,
      template: { slug: "approval-workflow", formValues: { region: "eastus" } },
    });
    expect(result).toBe("malaysiawest");
  });
});
