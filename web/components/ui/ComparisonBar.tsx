"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface ComparisonBarProps {
  label: string;
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
  leftMeta?: string;
  rightMeta?: string;
  improvement?: string;
  className?: string;
}

export function ComparisonBar({
  label,
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  leftMeta,
  rightMeta,
  improvement,
  className,
}: ComparisonBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const leftPct  = Math.min(Math.max(leftValue, 0), 100) / 100;
  const rightPct = Math.min(Math.max(rightValue, 0), 100) / 100;

  const barTransition = (delay: number) => ({
    duration: 0.85,
    ease: [0.22, 1, 0.36, 1] as const,
    delay,
  });

  return (
    <div ref={ref} className={cn("space-y-3", className)}>
      {/* Metric label */}
      <p className="text-sm font-semibold text-text">{label}</p>

      {/* Left (before) row */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-text-muted">{leftLabel}</span>
          {leftMeta && (
            <span className="text-xs tabular-nums text-text-faint">{leftMeta}</span>
          )}
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-elevated">
          <motion.div
            className="absolute inset-y-0 left-0 origin-left rounded-full"
            style={{ width: `${leftPct * 100}%`, backgroundColor: "var(--color-text-faint)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: inView ? 1 : 0 }}
            transition={barTransition(0.1)}
          />
        </div>
      </div>

      {/* Right (after) row */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-text">{rightLabel}</span>
          <div className="flex items-center gap-2">
            {rightMeta && (
              <span className="text-xs font-semibold tabular-nums text-accent">{rightMeta}</span>
            )}
            {improvement && (
              <motion.span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  backgroundColor: "var(--color-accent-glow)",
                  color: "var(--color-accent)",
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 0.8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: 0.95 }}
              >
                {improvement}
              </motion.span>
            )}
          </div>
        </div>
        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-elevated">
          <motion.div
            className="absolute inset-y-0 left-0 origin-left rounded-full"
            style={{ width: `${rightPct * 100}%`, backgroundColor: "var(--color-accent)" }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: inView ? 1 : 0 }}
            transition={barTransition(0.35)}
          />
        </div>
      </div>
    </div>
  );
}
