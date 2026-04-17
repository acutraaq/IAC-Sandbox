"use client";

import Link from "next/link";
import { Clock, Layers, Lock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { Template } from "@/types";

interface TemplateCardProps {
  template: Template;
}

const categoryLabels: Record<string, string> = {
  compute: "Compute",
  data: "Data",
  network: "Network",
  security: "Security",
  "landing-zone": "Starter Kit",
};

export function TemplateCard({ template }: TemplateCardProps) {
  const isBlocked = template.policyBlocked === true;

  const inner = (
    <>
      {!isBlocked && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 w-0.5 origin-top scale-y-0 bg-accent transition-transform duration-200 group-hover:scale-y-100"
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${isBlocked ? "bg-text-muted/10" : "bg-accent/10"}`}>
          {isBlocked
            ? <Lock className="h-5 w-5 text-text-muted" aria-hidden="true" />
            : <DynamicIcon name={template.icon} className="h-5 w-5 text-accent" />}
        </div>
        {isBlocked
          ? <Badge variant="default" className="opacity-60">Not available</Badge>
          : <Badge variant="default">{categoryLabels[template.category] ?? template.category}</Badge>}
      </div>

      <div className="flex-1">
        <h3 className={`mb-1.5 font-display font-semibold transition-colors ${isBlocked ? "text-text-muted" : "text-text group-hover:text-accent"}`}>
          {template.name}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-text-muted">
          {isBlocked ? "Not permitted by subscription policy in this environment." : template.description}
        </p>
      </div>

      <div className="flex items-center gap-5 font-mono text-[11px] text-text-muted">
        <span className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" aria-hidden="true" />
          {template.resourceCount}&nbsp;
          {template.resourceCount === 1 ? "resource" : "resources"}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {template.estimatedTime}
        </span>
      </div>
    </>
  );

  if (isBlocked) {
    return (
      <div
        aria-disabled="true"
        className="relative flex flex-col gap-4 overflow-hidden rounded-md border border-border bg-surface/50 p-6 opacity-60 cursor-not-allowed select-none"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/templates/${template.slug}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-md border border-border bg-surface p-6 transition-colors hover:border-accent/25 hover:bg-surface-elevated"
    >
      {inner}
    </Link>
  );
}
