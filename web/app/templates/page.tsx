"use client";

import { useState } from "react";
import Link from "next/link";
import templatesData from "@/data/templates.json";
import { TemplateRow } from "@/components/templates/TemplateRow";
import { FilterPills } from "@/components/templates/FilterPills";
import { ArrowRight } from "lucide-react";
import type { Template } from "@/types";

const ALL_TEMPLATES = templatesData as Template[];

const FILTER_CATEGORIES = [
  { value: "all",           label: "All" },
  { value: "compute",       label: "Web & Apps" },
  { value: "data",          label: "Storage & Databases" },
  { value: "network",       label: "Networking" },
  { value: "security",      label: "Security" },
  { value: "automation",    label: "Automation" },
  { value: "integration",   label: "Messaging" },
  { value: "landing-zone",  label: "Starter Kits" },
];

export default function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  const visible = (activeCategory === "all"
    ? ALL_TEMPLATES
    : ALL_TEMPLATES.filter((t) => t.category === activeCategory)
  ).filter((t) => !t.policyBlocked);

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
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

      {/* Bottom CTA */}
      <section className="mt-12 rounded-xl border border-border bg-surface px-6 py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Need something different?</p>
            <p className="mt-0.5 text-xs text-text-muted">
              If none of these fit, submit a custom setup request. Our team will provision it after HOD approval.
            </p>
          </div>
          <Link
            href="/request"
            className="shrink-0 inline-flex items-center gap-2 rounded-full border border-border bg-bg px-5 py-2.5 text-sm font-medium text-accent transition-all hover:bg-surface-highlight hover:border-accent/30"
          >
            Request a Custom Setup
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
