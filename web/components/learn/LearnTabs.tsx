"use client";

import { useState } from "react";
import { FilterPills } from "@/components/templates/FilterPills";
import { GuideSection } from "./GuideSection";
import { LEARN_TOPICS } from "@/data/learn-content";

export function LearnTabs() {
  const [activeSlug, setActiveSlug] = useState(LEARN_TOPICS[0].slug);
  const activeTopic = LEARN_TOPICS.find((t) => t.slug === activeSlug) ?? LEARN_TOPICS[0];

  return (
    <div>
      <div className="mb-8">
        <FilterPills
          selected={activeSlug}
          onChange={setActiveSlug}
          categories={LEARN_TOPICS.map((t) => ({ value: t.slug, label: t.title }))}
        />
      </div>
      <GuideSection topic={activeTopic} />
    </div>
  );
}
