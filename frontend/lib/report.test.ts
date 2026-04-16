import { describe, it, expect } from "vitest";
import { generateReport } from "./report";

describe("generateReport — subscription and resource group", () => {
  it("shows real subscription name", () => {
    const report = generateReport("SUB-001", {
      mode: "template",
      selectedTemplate: {
        slug: "web-application",
        name: "Web Application",
        steps: [],
      },
      wizardState: { currentStep: 0, completedSteps: [], formValues: { appName: "my-app" } },
      selectedResources: [],
    });
    expect(report).toContain("Target Sub    : sub-epf-sandbox-internal");
  });

  it("derives RG name from template appName", () => {
    const report = generateReport("SUB-001", {
      mode: "template",
      selectedTemplate: {
        slug: "web-application",
        name: "Web Application",
        steps: [],
      },
      wizardState: { currentStep: 0, completedSteps: [], formValues: { appName: "my-app" } },
      selectedResources: [],
    });
    expect(report).toContain("Target RG     : my-app-rg");
  });

  it("derives RG name from first custom resource name", () => {
    const report = generateReport("SUB-002", {
      mode: "custom",
      selectedTemplate: null,
      wizardState: { currentStep: 0, completedSteps: [], formValues: {} },
      selectedResources: [
        { type: "Microsoft.Storage/storageAccounts", name: "my-storage", icon: "HardDrive", config: {} },
      ],
    });
    expect(report).toContain("Target RG     : my-storage-rg");
  });

  it("falls back to sandbox-rg when no name available", () => {
    const report = generateReport("SUB-003", {
      mode: "custom",
      selectedTemplate: null,
      wizardState: { currentStep: 0, completedSteps: [], formValues: {} },
      selectedResources: [],
    });
    expect(report).toContain("Target RG     : sandbox-rg");
  });
});
