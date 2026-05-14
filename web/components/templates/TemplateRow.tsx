"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Template } from "@/types";

interface TemplateRowProps {
  template: Template;
  index: number; // 1-based, formatted as 01..16
}

const categoryLabels: Record<string, string> = {
  compute: "compute",
  data: "data",
  network: "network",
  security: "security",
  "landing-zone": "landing-zone",
  automation: "automation",
  integration: "integration",
};

export function TemplateRow({ template, index }: TemplateRowProps) {
  const num = String(index).padStart(2, "0");
  const cat = categoryLabels[template.category] ?? template.category;

  return (
    <Link
      href={`/templates/${template.slug}`}
      className="group grid grid-cols-[2.5rem_auto_1fr_auto] items-center gap-x-4 gap-y-1 border-b border-border px-2 py-4 transition-colors hover:bg-surface-elevated/60 sm:grid-cols-[2.5rem_14rem_1fr_8rem_2rem]"
    >
      <span className="font-mono text-xs text-text-faint">{num}</span>

      <span className="font-mono text-xs text-prompt">
        {cat}/{template.slug}
      </span>

      <div className="col-span-2 sm:col-span-1">
        <p className="text-sm font-semibold text-text">{template.name}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
          {template.description}
        </p>
      </div>

      <span className="hidden text-[11px] uppercase tracking-[0.075em] font-semibold text-text-muted sm:inline">
        {template.resourceCount} res · {template.estimatedTime}
      </span>

      <span className="hidden justify-self-end opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
        <ArrowRight className="h-4 w-4 text-accent" />
      </span>
    </Link>
  );
}
