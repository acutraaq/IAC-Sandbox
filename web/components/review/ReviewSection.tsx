"use client";

import { displayFieldValue } from "@/lib/display";
import type { DeploymentState } from "@/types";

type ReviewProps = Pick<
  DeploymentState,
  "mode" | "selectedTemplate" | "wizardState"
>;

export function ReviewSection({
  mode,
  selectedTemplate,
  wizardState,
}: ReviewProps) {
  if (mode === "template" && selectedTemplate) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            Template
          </p>
          <p className="text-lg font-semibold text-text">
            {selectedTemplate.name}
          </p>
        </div>

        {selectedTemplate.steps.map((step, stepIndex) => {
          const stepFields = step.fields.filter((f) => {
            const val = wizardState.formValues[f.name];
            return val !== undefined && val !== null && val !== "";
          });
          if (stepFields.length === 0) return null;

          return (
            <div
              key={stepIndex}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <p className="mb-3 text-sm font-semibold text-text">
                {step.title}
              </p>
              <dl className="space-y-2">
                {stepFields.map((field) => {
                  const value = wizardState.formValues[field.name];

                  return (
                    <div key={field.name} className="flex gap-3 text-sm">
                      <dt className="min-w-0 flex-1 text-text-muted">
                        {field.label}
                      </dt>
                      <dd className="font-medium text-text">{displayFieldValue(field, value)}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
