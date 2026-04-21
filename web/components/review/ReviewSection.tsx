"use client";

import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { displayFieldValue } from "@/lib/display";
import type { DeploymentState } from "@/types";

type ReviewProps = Pick<
  DeploymentState,
  "mode" | "selectedTemplate" | "wizardState" | "selectedResources"
>;

export function ReviewSection({
  mode,
  selectedTemplate,
  wizardState,
  selectedResources,
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

  if (mode === "custom") {
    return (
      <div className="space-y-4">
        {selectedResources.map((resource) => (
          <div
            key={resource.type}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                <DynamicIcon name={resource.icon} className="h-4 w-4 text-accent" />
              </div>
              <p className="font-semibold text-text">{resource.name}</p>
            </div>
            <dl className="space-y-2 pl-11">
              {Object.entries(resource.config).map(([key, value]) => {
                if (value === undefined || value === null || value === "")
                  return null;
                return (
                  <div key={key} className="flex gap-3 text-sm">
                    <dt className="min-w-0 flex-1 text-text-muted">{key}</dt>
                    <dd className="font-medium text-text">{String(value)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
