import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TemplateGrid } from "@/components/home/TemplateGrid";
import { DeployedList } from "@/components/home/DeployedList";
import { PageTransition } from "@/components/layout/PageTransition";
import templatesData from "@/data/templates.json";
import type { Template } from "@/types";

const popularTemplates = (templatesData as Template[])
  .filter((t) => !t.policyBlocked)
  .slice(0, 4);

export default function Home() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-8 md:px-8 md:py-12">
        {/* Zone 1: Welcome */}
        <div>
          <h1
            className="text-4xl font-bold text-text animate-fade-up motion-reduce:animate-none"
            style={{ animationDelay: "0ms" }}
          >
            Sandbox
          </h1>
          <p
            className="mt-2 text-text-muted animate-fade-up motion-reduce:animate-none"
            style={{ animationDelay: "80ms" }}
          >
            Deploy Azure resources in minutes.
          </p>
          <div
            className="mt-6 flex flex-wrap gap-3 animate-fade-up motion-reduce:animate-none"
            style={{ animationDelay: "160ms" }}
          >
            <Button asChild size="md">
              <Link href="/templates">Browse Templates</Link>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href="/builder">Build Custom</Link>
            </Button>
          </div>
        </div>

        {/* Zone 2: Popular Templates */}
        <div
          className="animate-fade-up motion-reduce:animate-none"
          style={{ animationDelay: "260ms" }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              Popular Templates
            </h2>
            <Link href="/templates" className="text-sm text-accent hover:underline">
              View all templates →
            </Link>
          </div>
          <TemplateGrid templates={popularTemplates} />
        </div>

        {/* Zone 3: Recent Deployments */}
        <div
          className="animate-fade-up motion-reduce:animate-none"
          style={{ animationDelay: "360ms" }}
        >
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
            My Recent Deployments
          </h2>
          <DeployedList />
        </div>
      </div>
    </PageTransition>
  );
}
