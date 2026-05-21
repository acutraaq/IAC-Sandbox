"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqAccordionProps {
  items: FaqItem[];
  className?: string;
}

export function FaqAccordion({ items, className }: FaqAccordionProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIdx((prev) => (prev === index ? null : index));
  }

  return (
    <div className={cn("divide-y divide-border/40", className)}>
      {items.map((item, i) => {
        const num = String(i + 1).padStart(2, "0");
        const isOpen = openIdx === i;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-btn-${i}`;

        return (
          <div key={i} className="py-7">
            <button
              id={buttonId}
              onClick={() => toggle(i)}
              className="flex w-full items-baseline gap-3 text-left"
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              <span
                className="shrink-0 font-mono text-sm font-medium text-text-faint"
                aria-hidden="true"
              >
                {num}
              </span>
              <span className="text-base font-semibold text-text sm:text-lg">
                {item.question}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="pb-1 pl-10 pt-3 text-sm leading-relaxed text-text-muted">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
