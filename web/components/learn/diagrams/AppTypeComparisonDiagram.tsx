export function AppTypeComparisonDiagram() {
  return (
    <figure className="rounded-lg border border-border bg-surface p-4">
      <svg
        viewBox="0 0 320 200"
        className="aspect-[320/200] w-full text-text-faint"
        aria-hidden="true"
        role="presentation"
      >
        {/* axes */}
        <line x1="40" y1="10" x2="40" y2="170" stroke="currentColor" strokeWidth="1" />
        <line x1="40" y1="170" x2="310" y2="170" stroke="currentColor" strokeWidth="1" />
        <text x="10" y="15" className="fill-text-faint text-[9px] font-mono">AI-built</text>
        <text x="10" y="178" className="fill-text-faint text-[9px] font-mono">Manual</text>
        <text x="250" y="185" className="fill-text-faint text-[9px] font-mono">Data-first</text>
        <text x="45" y="185" className="fill-text-faint text-[9px] font-mono">Design-first</text>

        {/* Canvas: manual, design-first */}
        <circle cx="90" cy="140" r="6" className="fill-accent" />
        {/* Model-driven: manual, data-first */}
        <circle cx="250" cy="140" r="6" className="fill-accent" />
        {/* Vibe: AI-built, either */}
        <circle cx="170" cy="40" r="6" className="fill-accent" />
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-text-muted">
        <span>Canvas — design-first, manual</span>
        <span>Model-driven — data-first, manual</span>
        <span>Vibe — AI-generated from a prompt</span>
      </figcaption>
    </figure>
  );
}
