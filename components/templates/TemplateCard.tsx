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
      className="group flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
          <DynamicIcon name={template.icon} className="h-6 w-6 text-accent" />
        </div>
        <Badge variant="default">
          {categoryLabels[template.category] ?? template.category}
        </Badge>
      </div>

      <div className="flex-1">
        <h3 className="mb-1.5 font-semibold text-text transition-colors group-hover:text-accent">
          {template.name}
        </h3>
        <p className="text-sm leading-relaxed text-text-muted line-clamp-2">
          {template.description}
        </p>
      </div>

      <div className="flex items-center gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          {template.resourceCount}{" "}
          {template.resourceCount === 1 ? "resource" : "resources"}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {template.estimatedTime}
        </span>
      </div>
    </Link>
  );
}
