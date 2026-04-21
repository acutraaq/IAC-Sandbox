"use client";

import { Check } from "lucide-react";
import { displayFieldValue } from "@/lib/display";
import type { TemplateStep } from "@/types";

interface SummaryPanelProps {
  steps: TemplateStep[];
  completedSteps: number[];
  formValues: Record<string, unknown>;
}

export function SummaryPanel({
  steps,
  completedSteps,
  formValues,
}: SummaryPanelProps) {
  const hasCompleted = completedSteps.length > 0;

  return (
    <aside
      aria-label="Setup summary"
      className="rounded-xl border border-border bg-surface p-5"
    >
      <h3 className="mb-4 text-sm font-semibold text-text">Your Summary</h3>

      {!hasCompleted ? (
        <p className="text-xs text-text-muted">
          Your choices will appear here as you complete each step.
        </p>
      ) : (
        <div className="space-y-4">
          {completedSteps.map((stepIndex) => {
            const step = steps[stepIndex];
            if (!step) return null;

            return (
              <div key={stepIndex}>
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-success" />
                  <span className="text-xs font-medium text-text">
                    {step.title}
                  </span>
                </div>
                <div className="space-y-1 pl-5">
                  {step.fields.map((field) => {
                    const value = formValues[field.name];
                    if (value === undefined || value === null || value === "")
                      return null;

                    return (
                      <div key={field.name} className="text-xs text-text-muted">
                        <span className="text-text-muted">{field.label}:</span>{" "}
                        <span className="font-medium text-text">
                          {displayFieldValue(field, value)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
