import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DeployedList } from "@/components/home/DeployedList";
import { NavLink } from "@/components/home/NavLink";
import { TerminalHero } from "@/components/home/TerminalHero";
import { TemplateRow } from "@/components/templates/TemplateRow";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { MonoSectionHeader } from "@/components/ui/MonoSectionHeader";
import { DocumentDivider } from "@/components/ui/DocumentDivider";
import { ArrowRight } from "lucide-react";
import templatesData from "@/data/templates.json";
import type { Template } from "@/types";

const popularTemplates = (templatesData as Template[])
  .filter((t) => !t.policyBlocked)
  .slice(0, 4);

export default function Home() {
  return (
    <div className="line-gutter mx-auto max-w-7xl space-y-14 px-6 py-10 md:px-8 md:py-16">
      <PageEyebrow path="" />

      <header className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-12">
        <div className="min-w-0">
          <pre
            className="m-0 font-mono text-text leading-[1.4] text-[clamp(1.25rem,2.6vw,2rem)] font-medium whitespace-pre"
            aria-label="Sandbox — Azure IaC for EPF"
          >
{`# ----------------------------
# Sandbox — Azure IaC for EPF
# ----------------------------`}
          </pre>
          <p className="mt-6 max-w-[65ch] text-base text-text-muted md:text-lg">
            Deploy Azure resources in minutes. Pick a template, build your own
            setup, or request a custom configuration.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/templates">
                Browse Templates
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <NavLink href="/builder" mode="custom" variant="secondary" size="lg">
              Build Custom
            </NavLink>
            <NavLink href="/request" mode="custom-request" variant="ghost" size="lg">
              Request Custom Setup
            </NavLink>
          </div>
        </div>
        <div className="w-full">
          <TerminalHero />
        </div>
      </header>

      <DocumentDivider label="popular-templates" />

      <section>
        <MonoSectionHeader
          title="popular-templates"
          description="Quick-start configurations for common workloads."
          rightSlot={
            <Link
              href="/templates"
              className="flex items-center gap-1 font-mono text-xs text-accent hover:text-accent-hover"
            >
              view all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="border-t border-border">
          {popularTemplates.map((t, i) => (
            <TemplateRow key={t.slug} template={t} index={i + 1} />
          ))}
        </div>
      </section>

      <DocumentDivider label="recent-deployments" />

      <section>
        <MonoSectionHeader
          title="recent-deployments"
          description="Your latest Azure resource group deployments."
        />
        <DeployedList />
      </section>
    </div>
  );
}
