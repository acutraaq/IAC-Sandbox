const STAGES = ["Prompt", "Plan", "Generate", "Refine", "Publish"];

export function VibeWorkflowDiagram() {
  return (
    <figure className="rounded-lg border border-border bg-surface p-4">
      <svg
        viewBox="0 0 500 80"
        className="w-full text-text-faint"
        aria-hidden="true"
        role="presentation"
      >
        {STAGES.map((stage, i) => {
          const x = 10 + i * 98;
          return (
            <g key={stage}>
              <rect
                x={x}
                y="20"
                width="80"
                height="40"
                rx="6"
                className="fill-surface-elevated stroke-border"
                strokeWidth="1"
              />
              {i < STAGES.length - 1 && (
                <line
                  x1={x + 80}
                  y1="40"
                  x2={x + 98}
                  y2="40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
              )}
            </g>
          );
        })}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="fill-text-faint" />
          </marker>
        </defs>
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-text-muted">
        {STAGES.map((stage) => (
          <span key={stage}>{stage}</span>
        ))}
      </figcaption>
    </figure>
  );
}
