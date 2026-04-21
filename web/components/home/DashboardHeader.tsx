"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export function DashboardHeader() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-12 mt-4 flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end"
    >
      <div className="flex flex-col">
        <span className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-text-muted">
          Dashboard
        </span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-text">
          Azure Infrastructure
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Pick a template to deploy, or use the builder for custom configurations.
        </p>
      </div>

      <Link
        href="/builder"
        className="group relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent-hover hover:shadow-accent/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {/* Subtle shine effect on hover */}
        <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
        <Plus size={16} />
        Build Custom
      </Link>
    </motion.div>
  );
}
