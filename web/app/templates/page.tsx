"use client";

import { useState } from "react";
import templatesData from "@/data/templates.json";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { PageTransition } from "@/components/layout/PageTransition";
import { TemplateRow } from "@/components/templates/TemplateRow";
import { FilterPills } from "@/components/templates/FilterPills";
import type { Template } from "@/types";

const ALL_TEMPLATES = templatesData as Template[];

const FILTER_CATEGORIES = [
  { value: "all",           label: "All" },
  { value: "automation",    label: "Automation" },
  { value: "compute",       label: "Web & Apps" },
];

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const visible = (activeCategory === "all"
    ? ALL_TEMPLATES
    : ALL_TEMPLATES.filter((t) => t.category === activeCategory)
  ).filter((t) => !t.policyBlocked);

  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        <PageEyebrow path="templates" />
        {/* Page header */}
        <header className="mb-8">
          <h1 className="font-sans text-2xl font-bold text-text md:text-3xl">
            What do you want to deploy?
          </h1>
        <p className="mt-2 max-w-[60ch] text-sm text-text-muted md:text-base">
          Pick a template to get started. Each one walks you through the setup step by step — no cloud knowledge needed.
        </p>
      </header>

      {/* Category filter */}
      <div className="mb-8">
        <FilterPills
          selected={activeCategory}
          onChange={setActiveCategory}
          categories={FILTER_CATEGORIES}
        />
      </div>

      {/* Template grid */}
      {visible.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((t, i) => (
            <TemplateRow key={t.slug} template={t} index={i + 1} />
          ))}
        </div>
      )}

      {/* Nothing matched filter */}
      {visible.length === 0 && (
        <div className="rounded-xl border border-border bg-surface px-8 py-16 text-center">
          <p className="text-sm font-semibold text-text">No templates in this category</p>
          <button
            onClick={() => setActiveCategory("all")}
            className="mt-3 text-sm text-accent hover:underline"
          >
            Show all templates
          </button>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
