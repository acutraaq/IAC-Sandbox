export function CopilotDecisionDiagram() {
  return (
    <figure className="rounded-lg border border-border bg-surface p-4">
      <svg
        viewBox="0 0 320 140"
        className="w-full text-text-faint"
        aria-hidden="true"
        role="presentation"
      >
        <rect x="90" y="5" width="140" height="34" rx="6" className="fill-surface-elevated stroke-border" strokeWidth="1" />
        <line x1="160" y1="39" x2="70" y2="80" stroke="currentColor" strokeWidth="1.5" />
        <line x1="160" y1="39" x2="250" y2="80" stroke="currentColor" strokeWidth="1.5" />
        <rect x="5" y="80" width="130" height="50" rx="6" className="fill-accent-glow stroke-accent/40" strokeWidth="1" />
        <rect x="185" y="80" width="130" height="50" rx="6" className="fill-accent-glow stroke-accent/40" strokeWidth="1" />
      </svg>
      <figcaption className="mt-3 grid grid-cols-1 gap-3 font-mono text-xs text-text-muted sm:grid-cols-2">
        <span>Quick Q&amp;A for one team → Copilot agents (Agent Builder)</span>
        <span>Multi-step workflow, external systems, many users → Copilot Studio</span>
      </figcaption>
    </figure>
  );
}
