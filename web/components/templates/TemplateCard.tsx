"use client";

import Link from "next/link";
import { Clock, Layers } from "lucide-react";
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

  return (
    <Link
      href={`/templates/${template.slug}`}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-md border border-border bg-surface p-6 transition-all duration-200 hover:border-accent/25 hover:bg-surface-elevated hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/10"
    >
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 top-0 w-0.5 origin-top scale-y-0 bg-accent transition-transform duration-200 group-hover:scale-y-100"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10">
          <DynamicIcon name={template.icon} className="h-5 w-5 text-accent" />
        </div>
        <Badge variant="default">{categoryLabels[template.category] ?? template.category}</Badge>
      </div>

      <div className="flex-1">
        <h3 className="mb-1.5 font-display font-semibold text-text transition-colors group-hover:text-accent">
          {template.name}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-text-muted">
          {template.description}
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
    </Link>
  );
}
