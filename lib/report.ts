import type { DeploymentState } from "@/types";

export function generateReport(
  submissionId: string,
  state: Pick<
    DeploymentState,
    "mode" | "selectedTemplate" | "wizardState" | "selectedResources"
  >,
): string {
  const now = new Date().toLocaleString("en-MY", {
    dateStyle: "full",
    timeStyle: "medium",
  });

  const lines: string[] = [
    "SANDBOX DEPLOYMENT PROOF",
    "========================",
    `Submission ID : ${submissionId}`,
    `Submitted By  : Demo User (demo@contoso.com)`,
    `Tenant        : contoso.onmicrosoft.com`,
    `Date/Time     : ${now}`,
    `Mode          : ${state.mode === "template" ? "Template" : "Custom"}`,
    `Target Sub    : (pending — configured at submission)`,
    `Target RG     : (pending — configured at submission)`,
    `Status        : accepted`,
    "",
    "Selection:",
  ];

  if (state.mode === "template" && state.selectedTemplate) {
    lines.push(`- Template: ${state.selectedTemplate.name}`);
    lines.push(`  Form Values:`);

    const values = state.wizardState.formValues;
    const steps = state.selectedTemplate.steps;

    for (const step of steps) {
      for (const field of step.fields) {
        const value = values[field.name];
        if (value !== undefined && value !== null && value !== "") {
          const displayValue =
            field.type === "toggle" ? (value ? "Yes" : "No") : String(value);
          lines.push(`    ${field.label}: ${displayValue}`);
        }
      }
    }
  } else if (state.mode === "custom") {
    for (let i = 0; i < state.selectedResources.length; i++) {
      const resource = state.selectedResources[i];
      lines.push(`- Resource ${i + 1}: ${resource.name}`);
      lines.push(`  Config:`);
      for (const [key, value] of Object.entries(resource.config)) {
        if (value !== undefined && value !== null && value !== "") {
          lines.push(`    ${key}: ${String(value)}`);
        }
      }
    }
  }

  lines.push("");
  lines.push(
    "Note: Manual HOD approval is required outside this system.",
  );

  return lines.join("\n");
}
