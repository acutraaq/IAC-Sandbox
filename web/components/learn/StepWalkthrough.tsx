"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { LearnStep } from "@/data/learn-content";

interface StepWalkthroughProps {
  steps: LearnStep[];
  topicSlug?: string;
}

export function StepWalkthrough({ steps, topicSlug = "default" }: StepWalkthroughProps) {
  const storageKey = `learn-progress-${topicSlug}`;
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    setOpenIndex(0);
    try {
      const raw = window.localStorage.getItem(storageKey);
      setCompleted(raw ? new Set(JSON.parse(raw)) : new Set());
    } catch {
      setCompleted(new Set());
    }
  }, [storageKey]);

  function toggleComplete(index: number, event: React.MouseEvent) {
    event.stopPropagation();
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // storage unavailable (private browsing, quota) — progress just won't persist
      }
      return next;
    });
  }

  return (
    <div>
      <p className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-text-faint">
        {completed.size} / {steps.length} complete
      </p>
      <ol className="space-y-2">
        {steps.map((step, i) => {
          const isOpen = openIndex === i;
          const isDone = completed.has(i);
          const detailId = `step-detail-${topicSlug}-${i}`;

          return (
            <li
              key={step.title}
              className="rounded-lg border border-border bg-surface transition-colors duration-150 hover:border-border-strong"
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={(e) => toggleComplete(i, e)}
                  aria-pressed={isDone}
                  aria-label={
                    isDone ? `Mark "${step.title}" as not done` : `Mark "${step.title}" as done`
                  }
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold transition-colors duration-150 ${
                    isDone
                      ? "border-accent bg-accent text-on-primary"
                      : "border-border-strong text-text-faint hover:border-accent hover:text-accent"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  aria-controls={detailId}
                  className="flex flex-1 items-center justify-between gap-2 text-left"
                >
                  <span
                    className={`text-sm font-semibold ${
                      isDone ? "text-text-muted line-through decoration-1" : "text-text"
                    }`}
                  >
                    {step.title}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-text-faint transition-transform duration-150 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              <div id={detailId} hidden={!isOpen} className="px-4 pb-4 pl-[3.25rem]">
                <p className="text-sm leading-relaxed text-text-muted">{step.detail}</p>

                {step.subSteps && step.subSteps.length > 0 && (
                  <ol className="mt-2 list-[lower-alpha] space-y-1 pl-5 text-sm leading-relaxed text-text-muted">
                    {step.subSteps.map((subStep) => (
                      <li key={subStep}>{subStep}</li>
                    ))}
                  </ol>
                )}

                {step.expectedResult && (
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    <span className="font-semibold">You should see:</span> {step.expectedResult}
                  </p>
                )}

                {step.pitfall && (
                  <p className="mt-2 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-sm leading-relaxed text-text-muted">
                    <span className="sr-only">Watch out: </span>
                    {step.pitfall}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
