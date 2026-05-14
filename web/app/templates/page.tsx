"use client";

import Link from "next/link";
import templatesData from "@/data/templates.json";
import { TemplateRow } from "@/components/templates/TemplateRow";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { MonoSectionHeader } from "@/components/ui/MonoSectionHeader";
import { DocumentDivider } from "@/components/ui/DocumentDivider";
import { ArrowRight } from "lucide-react";
import type { Template } from "@/types";

const BUNDLE_SLUGS = [
  "full-stack-web-app",
  "microservices-platform",
  "data-pipeline",
  "secure-api-backend",
];

const bundles = (templatesData as Template[]).filter((t) =>
  BUNDLE_SLUGS.includes(t.slug)
);
const individual = (templatesData as Template[]).filter(
  (t) => !BUNDLE_SLUGS.includes(t.slug)
);

export default function TemplatesPage() {
  return (
    <div className="line-gutter mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
      <PageEyebrow path="templates" />

      <header className="mb-10">
        <h1 className="font-mono text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium text-text">
          <span className="text-text-faint"># </span>
          templates
        </h1>
        <p className="mt-2 max-w-[65ch] text-sm text-text-muted md:text-base">
          Choose from pre-built configurations or start from scratch.
        </p>
      </header>

      <section className="mb-12">
        <MonoSectionHeader
          title="scenario-bundles"
          description="Pre-built multi-resource configurations for common workloads."
        />
        <div className="border-t border-border">
          {bundles.map((t, i) => (
            <TemplateRow key={t.slug} template={t} index={i + 1} />
          ))}
        </div>
      </section>

      <DocumentDivider label="individual-resources" />

      <section>
        <MonoSectionHeader
          title="individual-resources"
          description="Single-resource deployments for targeted infrastructure needs."
        />
        <div className="border-t border-border">
          {individual.map((t, i) => (
            <TemplateRow key={t.slug} template={t} index={i + 1} />
          ))}
        </div>
      </section>

      <section className="mt-14 border-y border-border py-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-sm text-text-muted">
            <span className="text-comment"># </span>
            can&apos;t find what you need? request a custom setup
          </p>
          <Link
            href="/request"
            className="shrink-0 inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-accent transition-all hover:bg-surface-elevated hover:border-accent/30"
          >
            Request a Custom Setup
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
