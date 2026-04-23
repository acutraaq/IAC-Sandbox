"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Badge } from "@/components/ui/Badge";
import { FilterPills } from "@/components/templates/FilterPills";
import type { AzureResource } from "@/types";

interface ResourceCatalogProps {
  resources: AzureResource[];
  selectedTypes: string[];
  onSelect: (resource: AzureResource) => void;
}

export function ResourceCatalog({
  resources,
  selectedTypes,
  onSelect,
}: ResourceCatalogProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = resources.filter((r) => {
    if (r.policyBlocked) return false;
    const matchesSearch =
      search === "" ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || r.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          aria-label="Search resources"
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <FilterPills selected={category} onChange={setCategory} />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          No resources match your search.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((resource) => {
            const isAdded = selectedTypes.includes(resource.type);
            return (
              <button
                key={resource.type}
                onClick={() => onSelect(resource)}
                className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  isAdded
                    ? "border-success/30 bg-success/5"
                    : "border-border bg-surface hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isAdded ? "bg-success/10" : "bg-accent/10"
                  }`}
                >
                  <DynamicIcon
                    name={resource.icon}
                    className={`h-5 w-5 ${isAdded ? "text-success" : "text-accent"}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text">
                      {resource.name}
                    </p>
                    <Badge variant={isAdded ? "success" : "default"}>
                      {isAdded ? "Added" : resource.category}
                    </Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                    {resource.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
