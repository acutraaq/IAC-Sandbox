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
    it("blocks approval-workflow (not currently exposed in catalog)", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "approval-workflow", formValues: {} },
      });
      expect(result).toEqual({ blocked: ["approval-workflow"] });
    });

    it("blocks scheduled-automation (not currently exposed in catalog)", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "scheduled-automation", formValues: {} },
      });
      expect(result).toEqual({ blocked: ["scheduled-automation"] });
    });

    it("blocks static-web-app (not currently exposed in catalog)", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "static-web-app", formValues: {} },
      });
      expect(result).toEqual({ blocked: ["static-web-app"] });
    });

    it("allows logic-app", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "logic-app", formValues: {} },
      });
      expect(result).toBeNull();
    });

    it("allows logic-app-storage", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "logic-app-storage", formValues: {} },
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
