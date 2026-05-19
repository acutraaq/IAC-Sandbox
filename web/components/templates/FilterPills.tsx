"use client";

import { motion } from "framer-motion";

export interface CategoryOption {
  value: string;
  label: string;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  { value: "all", label: "All" },
  { value: "automation", label: "Automation" },
  { value: "integration", label: "Integration" },
  { value: "compute", label: "Compute" },
  { value: "data", label: "Data" },
  { value: "network", label: "Network" },
  { value: "security", label: "Security" },
  { value: "landing-zone", label: "Starter Kits" },
];

interface FilterPillsProps {
  selected: string;
  onChange: (category: string) => void;
  categories?: CategoryOption[];
}

export function FilterPills({ selected, onChange, categories = DEFAULT_CATEGORIES }: FilterPillsProps) {
  return (
    <div role="group" aria-label="Filter by category" className="relative flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          aria-pressed={selected === cat.value}
          className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors z-10 ${
            selected === cat.value
              ? "text-white"
              : "border border-border bg-surface text-text-muted hover:border-accent/30 hover:text-text"
          }`}
        >
          {cat.label}
          {selected === cat.value && (
            <motion.span
              layoutId="active-pill-bg"
              className="absolute inset-0 -z-10 rounded-full bg-accent"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
