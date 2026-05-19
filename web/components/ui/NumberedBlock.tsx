"use client";

import { cn } from "@/lib/utils";

interface NumberedBlockProps {
  number: string;
  title: string;
  description: string;
  className?: string;
}

export function NumberedBlock({
  number,
  title,
  description,
  className,
}: NumberedBlockProps) {
  return (
    <div className={cn("relative space-y-2", className)}>
      <span
        className="font-mono text-[clamp(3rem,6vw,5rem)] font-bold leading-none text-text-faint/15 select-none"
        aria-hidden="true"
      >
        {number}
      </span>
      <h3 className="text-lg font-semibold text-text">{title}</h3>
      <p className="text-sm leading-relaxed text-text-muted">{description}</p>
    </div>
  );
}
