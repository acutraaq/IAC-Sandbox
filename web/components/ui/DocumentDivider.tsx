interface DocumentDividerProps {
  label?: string; // optional inline mono label
  className?: string;
}

export function DocumentDivider({ label, className = "" }: DocumentDividerProps) {
  return (
    <div className={`my-6 flex items-center gap-3 ${className}`} role="separator">
      <span className="font-mono text-xs text-text-faint">---</span>
      {label && (
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-faint">
          {label}
        </span>
      )}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
