"use client";

import Link from "next/link";
import { X, ArrowRight, PackageOpen } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Button } from "@/components/ui/Button";
import type { SelectedResource } from "@/types";

interface SelectedPanelProps {
  resources: SelectedResource[];
  onRemove: (type: string) => void;
}

export function SelectedPanel({ resources, onRemove }: SelectedPanelProps) {
  return (
    <aside
      aria-label="Your selected resources"
      className="flex min-h-0 flex-1 flex-col rounded-xl border border-border bg-surface p-5"
    >
      <h2 className="mb-4 flex shrink-0 items-center gap-2 text-sm font-semibold text-text">
        Your Setup
        {resources.length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-white">
            {resources.length}
          </span>
        )}
      </h2>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {resources.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <PackageOpen className="h-8 w-8 text-text-muted" />
            <p className="text-xs text-text-muted">
              No resources added yet.
              <br />
              Choose from the catalog.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {resources.map((r) => (
              <div
                key={r.type}
                className="flex items-center gap-3 rounded-lg border border-border bg-surface-elevated p-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  <DynamicIcon name={r.icon} className="h-4 w-4 text-accent" />
                </div>
                <span className="flex-1 text-sm text-text">{r.name}</span>
                <button
                  onClick={() => onRemove(r.type)}
                  aria-label={`Remove ${r.name}`}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded text-text-muted hover:text-error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 shrink-0">
        {resources.length === 0 ? (
          <Button disabled className="w-full">
            Continue to Review
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href="/review">
              Continue to Review
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </aside>
  );
}
