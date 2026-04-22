"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { listMyDeployments } from "@/lib/api";
import type { MyDeploymentItem, DeploymentStatus } from "@/types";

function statusDot(status: DeploymentStatus) {
  switch (status) {
    case "succeeded": return "bg-success";
    case "failed":    return "bg-error";
    case "running":   return "bg-accent animate-pulse";
    default:          return "bg-warning animate-pulse";
  }
}

function statusLabel(status: DeploymentStatus) {
  switch (status) {
    case "succeeded": return "Succeeded";
    case "failed":    return "Failed";
    case "running":   return "Deploying";
    default:          return "Queued";
  }
}

function statusBadgeClass(status: DeploymentStatus) {
  switch (status) {
    case "succeeded": return "border-success/20 bg-success/10 text-success";
    case "failed":    return "border-error/20 bg-error/10 text-error";
    default:          return "border-warning/20 bg-warning/10 text-warning";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DeployedList() {
  const [items, setItems] = useState<MyDeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyDeployments()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted">
          Recent Deployments
        </h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
      >
        {loading && (
          <div className="px-6 py-8 text-center text-sm text-text-muted">
            Loading deployments…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-text-muted">
            No deployments yet. Start by creating one above.
          </div>
        )}

        {!loading && items.map((item, index) => (
          <div
            key={item.submissionId ?? item.resourceGroup}
            className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-elevated ${
              index !== items.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot(item.status)}`}
              />
              <span className="sr-only">{statusLabel(item.status)}</span>
              <div className="flex flex-col">
                <span className="font-display pr-4 text-sm font-bold text-text">
                  {item.resourceGroup}
                </span>
                <span className="mt-0.5 text-xs text-text-muted">
                  {item.deployedAt ? formatDate(item.deployedAt) : "—"}
                </span>
              </div>
            </div>
            <span
              className={`hidden items-center justify-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:flex ${statusBadgeClass(item.status)}`}
            >
              {statusLabel(item.status)}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
