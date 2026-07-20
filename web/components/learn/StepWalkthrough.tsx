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

            {step.subSteps && step.subSteps.length > 0 && (
              <ol className="mt-2 list-[lower-alpha] space-y-1 pl-5 text-sm leading-relaxed text-text-muted">
                {step.subSteps.map((subStep) => (
                  <li key={subStep}>{subStep}</li>
                ))}
              </ol>
            )}

            {step.expectedResult && (
              <p className="mt-2 text-sm leading-relaxed text-text-faint">
                <span className="font-semibold text-text-muted">You should see:</span>{" "}
                {step.expectedResult}
              </p>
            )}

            {step.pitfall && (
              <p className="mt-2 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-sm leading-relaxed text-text-muted">
                {step.pitfall}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
