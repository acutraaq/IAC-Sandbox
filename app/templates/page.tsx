import templates from "@/data/templates.json";
import { TemplateGrid } from "@/components/templates/TemplateGrid";
import type { Template } from "@/types";

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-text">Templates</h1>
        <p className="mt-2 text-text-muted">
          Ready-made configurations for common cloud setups. Pick one to get
          started in minutes.
        </p>
      </div>
      <TemplateGrid templates={templates as Template[]} />
    </div>
  );
}
