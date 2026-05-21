"use client";

import { createElement } from "react";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { getIcon } from "@/lib/icons";
import type { Template } from "@/types";

interface TemplateRowProps {
  template: Template;
  index: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  compute:        "Web & Apps",
  data:           "Storage & Databases",
  network:        "Networking",
  security:       "Security",
  "landing-zone": "Starter Kits",
  automation:     "Automation",
  integration:    "Messaging",
};

export function TemplateRow({ template }: TemplateRowProps) {
  const catName = CATEGORY_LABELS[template.category] ?? template.category;
  const locked  = template.policyBlocked === true;

  if (locked) {
    return (
      <div
        aria-disabled="true"
        className="flex flex-col rounded-xl border border-border bg-surface p-5 opacity-60 cursor-not-allowed select-none"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
            <Lock className="h-4 w-4 text-text-faint" />
          </div>
          <span className="rounded-full border border-error/20 bg-error/8 px-2 py-0.5 text-xs font-semibold text-error">
            Not available
          </span>
        </div>
        <p className="text-sm font-semibold text-text">{template.name}</p>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          {template.description}
        </p>
        <p className="mt-3 text-xs text-text-faint">
          Not available in this environment
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/templates/${template.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-surface p-5 transition-all duration-150 hover:border-border-strong hover:bg-surface-highlight"
    >
      {/* Header row */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg border border-border">
          {createElement(getIcon(template.icon), { className: "h-4 w-4 text-accent" })}
        </div>
        <span className="rounded-full border border-border bg-bg px-2 py-0.5 text-xs font-medium text-text-muted">
          {catName}
        </span>
      </div>

      {/* Content */}
      <p className="text-sm font-semibold text-text">{template.name}</p>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-text-muted">
        {template.description}
      </p>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-text-faint">
          {template.resourceCount} {template.resourceCount === 1 ? "resource" : "resources"} · {template.estimatedTime}
        </span>
        <span className="flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
          Get started
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
