"use client";

import Link from "next/link";
import { DeployedTable } from "@/components/stuff/DeployedTable";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function MyStuffPage() {
  return (
    <div className="mx-auto max-w-7xl">
      {/* Header Area */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end"
      >
        <div className="flex flex-col">
          <span className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            My Stuff
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text">
            My stuff
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Click any item to see its receipt, change settings, or shut it down.
          </p>
        </div>

        <Link
          href="/builder"
          className="group relative flex h-10 items-center justify-center gap-2 overflow-hidden rounded-md bg-accent px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        >
          <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-full" />
          <Plus size={16} strokeWidth={2.5} />
          Create something new
        </Link>
      </motion.div>

      {/* Tabs Layout */}
      <div className="flex gap-6 border-b border-border">
        <button className="relative pb-4 font-display text-sm font-bold text-text">
          My projects
          <div className="absolute bottom-0 left-0 h-[2px] w-full bg-text" />
        </button>
      </div>

      {/* Data Table */}
      <DeployedTable />
    </div>
  );
}
