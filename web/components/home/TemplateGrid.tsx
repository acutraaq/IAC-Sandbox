import Link from "next/link";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { Template } from "@/types";

interface TemplateGridProps {
  templates: Template[];
}

export function TemplateGrid({ templates }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {templates.map((template) => (
        <Link
          key={template.slug}
          href={`/templates/${template.slug}`}
          className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-all hover:border-accent/30 hover:bg-surface-elevated hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/15">
            <DynamicIcon name={template.icon} className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{template.name}</p>
            <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
              {template.description}
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {template.estimatedTime}
          </p>
        </Link>
      ))}
    </div>
  );
}
