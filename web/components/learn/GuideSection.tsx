import { StepWalkthrough } from "./StepWalkthrough";
import { AppTypeComparisonDiagram } from "./diagrams/AppTypeComparisonDiagram";
import { VibeWorkflowDiagram } from "./diagrams/VibeWorkflowDiagram";
import { CopilotDecisionDiagram } from "./diagrams/CopilotDecisionDiagram";
import type { LearnTopic } from "@/data/learn-content";

const DIAGRAM_COMPONENTS = {
  "app-type-comparison": AppTypeComparisonDiagram,
  "vibe-workflow": VibeWorkflowDiagram,
  "copilot-decision": CopilotDecisionDiagram,
} as const;

interface GuideSectionProps {
  topic: LearnTopic;
}

export function GuideSection({ topic }: GuideSectionProps) {
  const Diagram = topic.diagram ? DIAGRAM_COMPONENTS[topic.diagram] : null;

  return (
    <section aria-labelledby={`learn-${topic.slug}-heading`}>
      <h2
        id={`learn-${topic.slug}-heading`}
        className="font-sans text-xl font-bold text-text md:text-2xl"
      >
        {topic.title}
      </h2>
      <p className="mt-2 max-w-[70ch] text-sm text-text-muted md:text-base">{topic.summary}</p>

      <div className="mt-3 rounded-lg border border-border bg-surface-elevated px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">
          When to use it
        </p>
        <p className="mt-1 text-sm text-text-muted">{topic.whenToUse}</p>
      </div>

      {Diagram && (
        <div className="my-6">
          <Diagram />
        </div>
      )}

      <div className="mt-6">
        <StepWalkthrough steps={topic.steps} />
      </div>

      {topic.callouts && topic.callouts.length > 0 && (
        <div className="mt-6 space-y-2">
          {topic.callouts.map((callout) => (
            <div
              key={callout}
              className="rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-text-muted"
            >
              {callout}
            </div>
          ))}
        </div>
      )}

      <a
        href={topic.learnMoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block text-sm text-accent hover:underline"
      >
        {topic.learnMoreLabel} →
      </a>
    </section>
  );
}
