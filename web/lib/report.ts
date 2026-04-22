import type { DeploymentState, ResourceGroupTags } from "@/types";
import { deriveResourceGroupName } from "@/lib/deployments/rg-name";
import { displayFieldValue } from "@/lib/display";

export function generateReport(
  submissionId: string,
  state: Pick<
    DeploymentState,
    "mode" | "selectedTemplate" | "wizardState" | "selectedResources"
  >,
  tags?: ResourceGroupTags,
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
    `Target Sub    : sub-epf-sandbox-internal`,
    `Target RG     : ${deriveResourceGroupName(
      // Adapt UI state to DeploymentPayload shape; tags are unused by deriveResourceGroupName.
      state.mode === "template" && state.selectedTemplate
        ? { mode: "template", template: { slug: state.selectedTemplate.slug, formValues: state.wizardState.formValues } }
        : { mode: "custom", resources: state.selectedResources }
    )}`,
    `Status        : accepted`,
    "",
    "Tags:",
    `  Cost Center  : ${tags?.["Cost Center"] ?? ""}`,
    `  Project ID   : ${tags?.["Project ID"] ?? ""}`,
    `  Project Owner: ${tags?.["Project Owner"] ?? ""}`,
    `  Expiry Date  : ${tags?.["Expiry Date"] ?? ""}`,
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
          lines.push(`    ${field.label}: ${displayFieldValue(field, value)}`);
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
