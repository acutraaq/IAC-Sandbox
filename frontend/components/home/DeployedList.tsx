"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const DEPLOYED = [
  {
    id: "dep-1",
    name: "marketing-infrastructure",
    type: "App Service + SQL Database",
    team: "Marketing Team",
    region: "East US",
    status: "success",
  },
  {
    id: "dep-2",
    name: "internal-reporting-storage",
    type: "Storage Account",
    team: "Finance Team",
    region: "West Europe",
    status: "success",
  },
];

export function DeployedList() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted">
          Recent Deployments
        </h2>
        <Link
          href="/templates"
          className="flex items-center gap-1 text-xs font-medium text-text hover:text-accent"
        >
          See all
          <ChevronRight size={14} />
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
      >
        {DEPLOYED.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between px-6 py-4 transition-colors hover:bg-surface-elevated ${
              index !== DEPLOYED.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  item.status === "success" ? "bg-success" : "bg-warning"
                }`}
              />
              <span className="sr-only">{item.status}</span>
              <div className="flex flex-col">
                <span className="font-display pr-4 text-sm font-bold text-text">
                  {item.name}
                </span>
                <span className="mt-0.5 text-xs text-text-muted">
                  {item.type} · {item.team} · {item.region}
                </span>
              </div>
            </div>
            <span 
              className={`hidden items-center justify-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest sm:flex ${
                item.status === "success" 
                  ? "border-success/20 bg-success/10 text-success" 
                  : "border-warning/20 bg-warning/10 text-warning"
              }`}
            >
              {item.status}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
