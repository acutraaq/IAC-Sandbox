import templates from "@/data/templates.json";
import { TemplateWizardClient } from "./TemplateWizardClient";
import type { Template } from "@/types";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return (templates as Template[]).map((t) => ({ slug: t.slug }));
}

export default async function TemplatePage({ params }: Props) {
  const { slug } = await params;
  const template = (templates as Template[]).find((t) => t.slug === slug);

  if (!template) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold text-text">Template not found</h1>
        <p className="mb-6 text-text-muted">
          We couldn&apos;t find a template with that name.
        </p>
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 text-accent hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all templates
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Templates", href: "/templates" },
          { label: template.name },
        ]}
      />
      <div className="mb-8">
        <Link
          href="/templates"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text focus-visible:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          All templates
        </Link>
        <h1 className="text-3xl font-bold text-text">{template.name}</h1>
        <p className="mt-1 text-text-muted">{template.description}</p>
      </div>

      <TemplateWizardClient template={template} />
    </div>
  );
}
