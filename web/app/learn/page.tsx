"use client";

import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { PageTransition } from "@/components/layout/PageTransition";
import { LearnTabs } from "@/components/learn/LearnTabs";

export default function LearnPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        <PageEyebrow path="learn" />
        <header className="mb-8">
          <h1 className="font-sans text-2xl font-bold text-text md:text-3xl">
            Learn Power Platform
          </h1>
          <p className="mt-2 max-w-[60ch] text-sm text-text-muted md:text-base">
            Step-by-step guides for building apps and AI agents — no prior experience needed.
          </p>
        </header>
        <LearnTabs />
      </div>
    </PageTransition>
  );
}
