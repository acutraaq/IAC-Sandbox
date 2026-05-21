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
      className="flex min-h-0 flex-1 flex-col rounded-md border border-border bg-surface p-5"
    >
      <div className="mb-4 flex shrink-0 items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text">
          Your Selection
          {resources.length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-bold text-on-primary">
              {resources.length}
            </span>
          )}
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {resources.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-highlight">
              <PackageOpen className="h-6 w-6 text-text-faint" />
            </div>
            <p className="text-xs text-text-muted">
              Nothing added yet. Pick resources from the list on the left to build your setup.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {resources.map((r) => (
              <div
                key={r.type}
                className="group flex items-center gap-3 rounded-md border border-border bg-surface-elevated p-3 transition-colors hover:border-border-strong"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent/10">
                  <DynamicIcon name={r.icon} className="h-4 w-4 text-accent" />
                </div>
                <span className="flex-1 text-sm font-medium text-text">{r.name}</span>
                <button
                  onClick={() => onRemove(r.type)}
                  aria-label={`Remove ${r.name}`}
                  className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:text-error hover:bg-error/10"
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
