"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMyDeployments } from "@/lib/api";
import type { MyDeploymentItem, DeploymentStatus } from "@/types";

function statusDot(status: DeploymentStatus) {
  switch (status) {
    case "succeeded": return "bg-success";
    case "failed":    return "bg-error";
    case "running":   return "bg-accent animate-pulse motion-reduce:animate-none";
    default:          return "bg-warning animate-pulse motion-reduce:animate-none";
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SkeletonRow() {
  return (
    <div
      data-testid="skeleton-row"
      className="h-16 rounded-md bg-surface-highlight animate-pulse motion-reduce:animate-none"
    />
  );
}

export function DeployedList() {
  const [items, setItems] = useState<MyDeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyDeployments()
      .then((data) => setItems(data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-sm text-text-muted">
          No deployments yet.{" "}
          <Link
            href="/templates"
            className="text-accent hover:text-accent-hover transition-colors"
          >
            Start with a template.
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col overflow-hidden rounded-md border border-border bg-surface">
        {items.map((item, index) => (
          <div
            key={item.submissionId ?? item.resourceGroup}
            className={`flex items-center justify-between px-5 py-3.5 transition-colors duration-150 hover:bg-surface-elevated ${
              index !== items.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${statusDot(item.status)}`}
              />
              <span className="sr-only">{statusLabel(item.status)}</span>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium text-text">
                  {item.resourceGroup}
                </p>
                <p className="text-xs text-text-muted">
                  {item.location}
                  {item.deployedAt && ` · ${formatDate(item.deployedAt)}`}
                </p>
              </div>
            </div>
            <span className="shrink-0 ml-4 text-xs font-semibold text-text-muted">
              {statusLabel(item.status)}
            </span>
          </div>
        ))}
      </div>
      <div className="text-right">
        <Link
          href="/my-stuff"
          className="text-sm font-medium text-accent hover:text-accent-hover transition-colors"
        >
          View all →
        </Link>
      </div>
    </div>
  );
}
