import templatesData from "@/data/templates.json";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateGrid } from "@/components/templates/TemplateGrid";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageTransition } from "@/components/layout/PageTransition";
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
    <PageTransition>
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Templates" }]}
        />

        {/* Scenario Bundles */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text">Scenario Bundles</h2>
          <p className="mt-1 text-sm text-text-muted">
            Pre-built multi-resource configurations for common workloads.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {bundles.map((t) => (
              <TemplateCard key={t.slug} template={t} />
            ))}
          </div>
        </section>

        {/* Individual Resources */}
        <section>
          <h2 className="mb-1 text-2xl font-semibold text-text">
            Individual Resources
          </h2>
          <p className="mb-6 text-sm text-text-muted">
            Single-resource deployments for targeted infrastructure needs.
          </p>
          <TemplateGrid templates={individual} />
        </section>
      </div>
    </PageTransition>
  );
}
