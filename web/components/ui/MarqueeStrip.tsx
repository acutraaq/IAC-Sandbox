"use client";

import { cn } from "@/lib/utils";

interface MarqueeStripProps {
  items: string[];
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
}

export function MarqueeStrip({
  items,
  speed = 40,
  pauseOnHover = true,
  className,
}: MarqueeStripProps) {
  const doubled = [...items, ...items];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-y border-border/50 bg-bg-deep/50 py-3",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-bg-deep/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-bg-deep/80 to-transparent" />

      <div
        className={cn(
          "flex w-max items-center gap-8",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
        style={{
          animation: `marquee-scroll ${speed}s linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-xs uppercase tracking-[0.1em] text-text-muted"
          >
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60"
            />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
