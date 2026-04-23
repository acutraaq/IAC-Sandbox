"use client";

import { Check } from "lucide-react";
import { motion } from "framer-motion";

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
                <motion.div
                  aria-current={isCurrent ? "step" : undefined}
                  animate={isCompleted ? { scale: [1, 1.18, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
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
                </motion.div>
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
                  className="relative mx-2 h-px flex-1 overflow-hidden bg-border"
                  aria-hidden="true"
                >
                  <motion.div
                    className="absolute inset-0 origin-left bg-success/60"
                    initial={false}
                    animate={{ scaleX: isCompleted ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
