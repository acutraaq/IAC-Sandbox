"use client";

import { useState } from "react";
import { TemplateCard } from "./TemplateCard";
import { FilterPills } from "./FilterPills";
import { Button } from "@/components/ui/Button";
import type { Template } from "@/types";

interface TemplateGridProps {
  templates: Template[];
}

export function TemplateGrid({ templates }: TemplateGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div className="space-y-8">
      <FilterPills selected={selectedCategory} onChange={setSelectedCategory} />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-text-muted">No templates match this filter.</p>
          <Button variant="ghost" size="sm" onClick={() => setSelectedCategory("all")}>
            Show all templates
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((template) => (
            <TemplateCard key={template.slug} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
