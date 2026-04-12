"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const options = [
  {
    number: "01",
    href: "/templates",
    title: "Browse Templates",
    description:
      "Ready-made Azure configurations for common setups. The fastest path from zero to running infrastructure.",
    cta: "View all templates",
    accent: true,
  },
  {
    number: "02",
    href: "/builder",
    title: "Build Custom Setup",
    description:
      "Pick individual Azure resources and configure them one by one. Complete flexibility over every detail.",
    cta: "Open builder",
    accent: false,
  },
];

export function GetStartedSection() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
            Get started
          </p>
          <h2 className="font-display text-4xl font-bold text-text">
            Pick your deployment path
          </h2>
        </motion.div>

        {/* Hairline-divided tiles using gap-px + bg-border trick */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid gap-px bg-border sm:grid-cols-2"
        >
          {options.map(({ number, href, title, description, cta, accent }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-5 bg-surface p-8 transition-colors hover:bg-surface-elevated"
            >
              <span className="font-mono text-xs uppercase tracking-[0.15em] text-text-muted">
                {number} /
              </span>
              <div className="flex-1">
                <h3
                  className={`font-display mb-2.5 text-2xl font-bold transition-colors group-hover:text-accent ${
                    accent ? "text-accent" : "text-text"
                  }`}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {description}
                </p>
              </div>
              <span className="flex items-center gap-1.5 font-mono text-xs text-text-muted transition-colors group-hover:text-accent">
                {cta}
                <ArrowRight
                  className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </motion.div>

        <p className="mt-8 text-xs text-text-muted">
          <span className="font-mono">NOTE</span>&ensp;—&ensp;Microsoft SSO is
          required to submit deployments. Contact your platform team for access.
        </p>
      </div>
    </section>
  );
}
