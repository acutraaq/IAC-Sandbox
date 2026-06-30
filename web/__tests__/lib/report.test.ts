import { describe, it, expect } from "vitest";
import { generateReport } from "@/lib/report";

const demoUser = { upn: "demo@sandbox.local", displayName: "Demo User" };

describe("generateReport", () => {
  const baseState = {
    mode: "template" as const,
    selectedTemplate: {
      slug: "approval-workflow",
      name: "Automated Approval Workflow",
      steps: [
        {
          title: "Basic Details",
          description: "Test",
          fields: [
            {
              name: "workflowName",
              label: "What should we call this workflow?",
              type: "text" as const,
              required: true,
            },
            {
              name: "region",
              label: "Where should it be created?",
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
        workflowName: "my-workflow",
        region: "southeastasia",
      },
    },
    selectedResources: [],
  };

  it("includes SANDBOX DEPLOYMENT PROOF header", () => {
    const report = generateReport("SUB-123", baseState, demoUser);
    expect(report).toContain("SANDBOX DEPLOYMENT PROOF");
    expect(report).toContain("========================");
  });

  it("includes submissionId", () => {
    const report = generateReport("SUB-ABC-123", baseState, demoUser);
    expect(report).toContain("Submission ID : SUB-ABC-123");
  });

  it("includes mode as Template", () => {
    const report = generateReport("SUB-123", baseState, demoUser);
    expect(report).toContain("Mode          : Template");
  });

  it("includes template name", () => {
    const report = generateReport("SUB-123", baseState, demoUser);
    expect(report).toContain("Template: Automated Approval Workflow");
  });

  it("includes form values", () => {
    const report = generateReport("SUB-123", baseState, demoUser);
    expect(report).toContain("my-workflow");
  });

  it("includes HOD approval note", () => {
    const report = generateReport("SUB-123", baseState, demoUser);
    expect(report).toContain(
      "Note: Manual HOD approval is required outside this system.",
    );
  });

  it("includes status accepted", () => {
    const report = generateReport("SUB-123", baseState, demoUser);
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

    const report = generateReport("SUB-456", customState, demoUser);
    expect(report).toContain("Mode          : Custom");
    expect(report).toContain("Resource 1: Secret Manager");
    expect(report).toContain("my-secrets");
  });
});
