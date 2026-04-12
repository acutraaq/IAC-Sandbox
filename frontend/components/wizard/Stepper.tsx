"use client";

import { Check } from "lucide-react";

interface StepperProps {
  steps: { title: string }[];
  currentStep: number;
  completedSteps: number[];
}

export function Stepper({ steps, currentStep, completedSteps }: StepperProps) {
  return (
    <nav aria-label="Setup progress" className="w-full">
      <ol className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = index === currentStep;

          return (
            <li key={index} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                    isCompleted
                      ? "bg-success text-white"
                      : isCurrent
                        ? "bg-accent text-white"
                        : "border border-border bg-surface text-text-muted"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`hidden text-xs sm:block ${
                    isCurrent ? "font-medium text-text" : "text-text-muted"
                  }`}
                >
                  {step.title}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={`mx-2 h-px flex-1 transition-colors ${
                    isCompleted ? "bg-success/50" : "bg-border"
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
