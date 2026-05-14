"use client";

interface PageEyebrowProps {
  path: string; // e.g. "templates", "templates/web-application"
  className?: string;
}

export function PageEyebrow({ path, className = "" }: PageEyebrowProps) {
  return (
    <div
      className={`mb-3 font-mono text-xs text-text-muted tracking-[0.05em] ${className}`}
      aria-hidden="true"
    >
      <span className="text-prompt">~/</span>
      {path}
    </div>
  );
}
