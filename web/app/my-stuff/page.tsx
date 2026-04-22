"use client";

import { useEffect, useState } from "react";
import { listMyDeployments, ApiError } from "@/lib/api";
import type { MyDeploymentItem } from "@/types";
import { Loader2, Package } from "lucide-react";

function statusLabel(status: MyDeploymentItem["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusColor(status: MyDeploymentItem["status"]): string {
  switch (status) {
    case "succeeded": return "text-green-400";
    case "failed": return "text-red-400";
    case "running": return "text-yellow-400";
    default: return "text-text-muted";
  }
}

export default function MyStuffPage() {
  const [items, setItems] = useState<MyDeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyDeployments()
      .then(setItems)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load deployments");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">My Stuff</h1>
        <p className="mt-1 text-text-muted">
          Resource groups you have deployed through this portal.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading deployments...</span>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          Failed to load: {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-text-muted">
          <Package className="h-10 w-10 opacity-40" />
          <p className="text-sm">No deployments found.</p>
          <p className="text-xs opacity-70">
            Deployments you submit will appear here.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.resourceGroup}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold text-text">
                    {item.resourceGroup}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {item.location}
                    {item.deployedAt && (
                      <>
                        {" · "}
                        {new Date(item.deployedAt).toLocaleDateString("en-MY", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </>
                    )}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-medium ${statusColor(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {(["Cost Center", "Project ID", "Project Owner", "Expiry Date"] as const).map(
                  (tag) =>
                    item.tags[tag] ? (
                      <span key={tag} className="text-xs text-text-muted">
                        <span className="font-medium text-text">{tag}:</span>{" "}
                        {item.tags[tag]}
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
