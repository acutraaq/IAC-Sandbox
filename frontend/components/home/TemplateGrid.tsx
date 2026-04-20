"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, HardDrive, Database, Webhook } from "lucide-react";

const TEMPLATES = [
  {
    id: "web-app",
    title: "App Service",
    description: "A ready-to-go scalable web application hosting environment.",
    time: "Ready in ~3 min",
    icon: Globe,
  },
  {
    id: "storage",
    title: "Storage Account",
    description: "A secure place to keep documents, blobs, or backups.",
    time: "Ready in ~1 min",
    icon: HardDrive,
  },
  {
    id: "database",
    title: "SQL Database",
    description: "A managed relational database with automated backups.",
    time: "Ready in ~5 min",
    icon: Database,
  },
  {
    id: "functions",
    title: "Azure Functions",
    description: "A serverless compute service for event-driven applications.",
    time: "Ready in ~2 min",
    icon: Webhook,
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function TemplateGrid() {
  return (
    <div className="mb-12">
      <h2 className="mb-4 font-mono text-xs font-bold uppercase tracking-widest text-text-muted">
        Popular Templates
      </h2>
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          return (
            <motion.div key={template.id} variants={item}>
              <Link
                href={`/templates/${template.id}`}
                className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface p-5 transition-all duration-300 hover:border-accent/40 hover:bg-surface-elevated hover:shadow-lg hover:shadow-accent/5"
              >
                {/* Decorative border glow on hover */}
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-accent/0 via-accent/0 to-accent/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                
                <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg text-text-muted shadow-sm transition-colors group-hover:border-accent/30 group-hover:text-accent">
                  <Icon size={20} strokeWidth={2} />
                </div>
                
                <h3 className="relative z-10 mt-5 font-display text-sm font-bold text-text">
                  {template.title}
                </h3>
                <p className="relative z-10 mt-2 flex-1 text-xs text-text-muted">
                  {template.description}
                </p>
                
                <div className="relative z-10 mt-5 mb-1 border-t border-border pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
                    {template.time}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
