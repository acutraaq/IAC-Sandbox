"use client";

import { useState } from "react";
import { GuideSection } from "./GuideSection";
import { LEARN_TOPICS } from "@/data/learn-content";

export function LearnTabs() {
  const [activeSlug, setActiveSlug] = useState(LEARN_TOPICS[0].slug);
  const activeTopic = LEARN_TOPICS.find((t) => t.slug === activeSlug) ?? LEARN_TOPICS[0];

  return (
    <div className="lg:grid lg:grid-cols-[15rem_1fr] lg:items-start lg:gap-10">
      <nav aria-label="Learn topics" className="mb-8 lg:sticky lg:top-24 lg:mb-0">
        <ol className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
          {LEARN_TOPICS.map((topic, i) => {
            const active = topic.slug === activeSlug;
            return (
              <li key={topic.slug} className="shrink-0 lg:shrink">
                <button
                  onClick={() => setActiveSlug(topic.slug)}
                  aria-pressed={active}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-150 ${
                    active
                      ? "bg-accent-glow font-semibold text-accent"
                      : "text-text-muted hover:bg-surface-elevated hover:text-text"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`font-mono text-xs ${active ? "text-accent" : "text-text-faint"}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {topic.title}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
      <GuideSection topic={activeTopic} />
    </div>
  );
}
