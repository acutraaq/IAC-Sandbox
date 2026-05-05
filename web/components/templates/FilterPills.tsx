"use client";

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
    <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          aria-pressed={selected === cat.value}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            selected === cat.value
              ? "bg-accent text-white"
              : "border border-border bg-surface text-text-muted hover:border-accent/30 hover:text-text"
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
