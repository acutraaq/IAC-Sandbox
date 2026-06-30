import { describe, it, expect } from "vitest";
import { validateDeploymentPolicy } from "@/lib/deployments/policy";

const validTags = {
  "Cost Center": "CC-001",
  "Project ID": "PRJ-001",
  "Project Owner": "owner@epf.gov.my",
  "Expiry Date": "2026-12-31",
};

describe("validateDeploymentPolicy", () => {
  describe("template mode", () => {
    it("allows approval-workflow", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "approval-workflow", formValues: {} },
      });
      expect(result).toBeNull();
    });

    it("allows scheduled-automation", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "scheduled-automation", formValues: {} },
      });
      expect(result).toBeNull();
    });

    it("allows static-web-app", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "static-web-app", formValues: {} },
      });
      expect(result).toBeNull();
    });

    it("blocks unknown slugs", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "web-application", formValues: {} },
      });
      expect(result).toEqual({ blocked: ["web-application"] });
    });

    it("blocks empty slug", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "", formValues: {} },
      });
      expect(result).toEqual({ blocked: [""] });
    });
  });

  describe("custom mode", () => {
    it("allows recognized resource types", () => {
      const result = validateDeploymentPolicy({
        mode: "custom",
        tags: validTags,
        resources: [
          { type: "Microsoft.KeyVault/vaults", name: "kv", icon: "KeyRound", config: {} },
          { type: "Microsoft.Storage/storageAccounts", name: "sa", icon: "HardDrive", config: {} },
        ],
      });
      expect(result).toBeNull();
    });

    it("blocks disallowed resource types", () => {
      const result = validateDeploymentPolicy({
        mode: "custom",
        tags: validTags,
        resources: [
          { type: "Microsoft.Blockchain/blockchainMembers", name: "bc", icon: "Link", config: {} },
        ],
      });
      expect(result).toEqual({ blocked: ["Microsoft.Blockchain/blockchainMembers"] });
    });

    it("returns multiple blocked types", () => {
      const result = validateDeploymentPolicy({
        mode: "custom",
        tags: validTags,
        resources: [
          { type: "invalid/type1", name: "a", icon: "X", config: {} },
          { type: "invalid/type2", name: "b", icon: "X", config: {} },
        ],
      });
      expect(result).toEqual({ blocked: ["invalid/type1", "invalid/type2"] });
    });

    it("returns null for empty resources array", () => {
      const result = validateDeploymentPolicy({
        mode: "custom",
        tags: validTags,
        resources: [],
      });
      expect(result).toBeNull();
    });
  });
});
