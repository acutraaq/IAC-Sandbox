import templates from "@/data/templates.json";
import { TemplateGrid } from "@/components/templates/TemplateGrid";
import type { Template } from "@/types";

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
          Deployment templates
        </p>
        <h1 className="font-display text-4xl font-bold text-text">Templates</h1>
        <p className="mt-3 text-text-muted">
          Ready-made Azure configurations for common cloud setups. Pick one to
          get started in minutes.
        </p>
      </div>
      <TemplateGrid templates={templates as Template[]} />
    </div>
  );
}
