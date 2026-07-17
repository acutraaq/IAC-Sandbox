import type { LearnStep } from "@/data/learn-content";

interface StepWalkthroughProps {
  steps: LearnStep[];
}

export function StepWalkthrough({ steps }: StepWalkthroughProps) {
  return (
    <ol className="space-y-5">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <span
            className="font-mono text-sm font-semibold text-text-faint select-none"
            aria-hidden="true"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="text-sm font-semibold text-text">{step.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
