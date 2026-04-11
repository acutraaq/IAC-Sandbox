import { describe, it, expect } from "vitest";
import { generateReport } from "@/lib/report";

describe("generateReport", () => {
  const baseState = {
    mode: "template" as const,
    selectedTemplate: {
      slug: "web-application",
      name: "Web Application",
      steps: [
        {
          title: "Basic Details",
          description: "Test",
          fields: [
            {
              name: "appName",
              label: "What should we call your application?",
              type: "text" as const,
              required: true,
            },
            {
              name: "region",
              label: "Where should it run?",
              type: "select" as const,
              required: true,
              options: [
                { label: "Southeast Asia (Singapore)", value: "southeastasia" },
              ],
            },
          ],
        },
      ],
    },
    wizardState: {
      currentStep: 0,
      completedSteps: [0],
      formValues: {
        appName: "my-app",
        region: "southeastasia",
      },
    },
    selectedResources: [],
  };

  it("includes SANDBOX DEPLOYMENT PROOF header", () => {
    const report = generateReport("SUB-123", baseState);
    expect(report).toContain("SANDBOX DEPLOYMENT PROOF");
    expect(report).toContain("========================");
  });

  it("includes submissionId", () => {
    const report = generateReport("SUB-ABC-123", baseState);
    expect(report).toContain("Submission ID : SUB-ABC-123");
  });

  it("includes mode as Template", () => {
    const report = generateReport("SUB-123", baseState);
    expect(report).toContain("Mode          : Template");
  });

  it("includes template name", () => {
    const report = generateReport("SUB-123", baseState);
    expect(report).toContain("Template: Web Application");
  });

  it("includes form values", () => {
    const report = generateReport("SUB-123", baseState);
    expect(report).toContain("my-app");
  });

  it("includes HOD approval note", () => {
    const report = generateReport("SUB-123", baseState);
    expect(report).toContain(
      "Note: Manual HOD approval is required outside this system.",
    );
  });

  it("includes status accepted", () => {
    const report = generateReport("SUB-123", baseState);
    expect(report).toContain("Status        : accepted");
  });

  it("generates custom mode report", () => {
    const customState = {
      mode: "custom" as const,
      selectedTemplate: null,
      wizardState: {
        currentStep: 0,
        completedSteps: [],
        formValues: {},
      },
      selectedResources: [
        {
          type: "Microsoft.KeyVault/vaults",
          name: "Secret Manager",
          icon: "KeyRound",
          config: { vaultName: "my-secrets", region: "southeastasia" },
        },
      ],
    };

    const report = generateReport("SUB-456", customState);
    expect(report).toContain("Mode          : Custom");
    expect(report).toContain("Resource 1: Secret Manager");
    expect(report).toContain("my-secrets");
  });
});
