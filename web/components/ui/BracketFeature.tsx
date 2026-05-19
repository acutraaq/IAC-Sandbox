"use client";

import { cn } from "@/lib/utils";

interface BracketFeatureProps {
  index: number;
  title: string;
  description: string;
  className?: string;
}

export function BracketFeature({
  index,
  title,
  description,
  className,
}: BracketFeatureProps) {
  const num = String(index).padStart(2, "0");

  return (
    <div className={cn("space-y-3", className)}>
      <span className="font-mono text-sm text-accent">
        [<span className="text-text"> {num} </span>]
      </span>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      <p className="text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}
