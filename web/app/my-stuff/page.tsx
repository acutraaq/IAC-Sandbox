"use client";

import { useState, useEffect } from "react";
import { listMyDeployments, ApiError } from "@/lib/api";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { getPublicAzureEnv } from "@/lib/env-public";
import { ExternalLink } from "lucide-react";
import type { MyDeploymentItem } from "@/types";

function statusLabel(status: MyDeploymentItem["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: MyDeploymentItem["status"]): string {
  switch (status) {
    case "succeeded": return "text-success";
    case "failed":    return "text-error";
    case "running":   return "text-accent";
    default:          return "text-warning";
  }
}

function SkeletonCard() {
  return (
    <div
      data-testid="skeleton-row"
      className="h-24 rounded-md bg-surface animate-pulse motion-reduce:animate-none"
    />
  );
}

export default function MyDeploymentsPage() {
  const [items, setItems] = useState<MyDeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyDeployments()
      .then(setItems)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load deployments"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-[clamp(48rem,80vw,80rem)] px-6 py-8 md:px-8 md:py-12">
      <PageEyebrow path="my-stuff" />

      <h1 className="font-mono text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium text-text">
        <span className="text-text-faint"># </span>My Deployments
      </h1>
      <p className="mt-2 mb-8 text-sm text-text-muted md:text-base">
        All the Azure environments you have set up through Sandbox.
      </p>

      {loading && (
        <div className="flex flex-col gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {error && (
        <p className="rounded-md border border-error/30 bg-error/15 px-4 py-3 text-sm text-error">
          Failed to load: {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-border bg-surface px-8 py-16 text-center">
          <p className="text-base font-semibold text-text">No deployments yet</p>
          <p className="mt-2 text-sm text-text-muted">You haven&apos;t deployed anything yet. Browse templates to get started.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li
              key={item.resourceGroup}
              className="group rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:bg-surface-highlight hover:border-border-strong"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-medium text-text">
                    {item.resourceGroup}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {item.location}
                    {item.deployedAt && (
                      <>
                        {" · "}
                        {new Date(item.deployedAt).toLocaleDateString(
                          "en-MY",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`shrink-0 text-sm font-medium ${statusClass(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                  <a
                    href={`https://portal.azure.com/#@/resource/subscriptions/${getPublicAzureEnv().subscriptionId}/resourceGroups/${item.resourceGroup}/overview`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted opacity-0 transition-all hover:bg-surface-elevated hover:text-text group-hover:opacity-100"
                    aria-label="Open in Azure Portal"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                {(
                  [
                    "Cost Center",
                    "Project ID",
                    "Project Owner",
                    "Expiry Date",
                  ] as const
                ).map((tag) =>
                  item.tags[tag] ? (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-highlight/60 px-2.5 py-1 text-xs"
                    >
                      <span className="font-medium text-text-muted">
                        {tag}:
                      </span>
                      <span className="text-text">{item.tags[tag]}</span>
                    </span>
                  ) : null
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
