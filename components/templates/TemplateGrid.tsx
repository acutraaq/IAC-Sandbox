"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TemplateCard } from "./TemplateCard";
import { FilterPills } from "./FilterPills";
import { Button } from "@/components/ui/Button";
import type { Template } from "@/types";

interface TemplateGridProps {
  templates: Template[];
}

export function TemplateGrid({ templates }: TemplateGridProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filtered =
    selectedCategory === "all"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  return (
    <div className="space-y-8">
      <FilterPills selected={selectedCategory} onChange={setSelectedCategory} />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <p className="text-text-muted">No templates match this filter.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            Show all templates
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((template, i) => (
              <motion.div
                key={template.slug}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{
                  duration: 0.28,
                  // Cap stagger at 5th card so the last few don't wait too long
                  delay: Math.min(i, 5) * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <TemplateCard template={template} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
