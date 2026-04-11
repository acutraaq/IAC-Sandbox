"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function GetStartedSection() {
  return (
    <section className="px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-3xl font-bold text-text sm:text-4xl">
          Ready to get started?
        </h2>
        <p className="mt-4 text-lg text-text-muted">
          Choose the option that fits your needs. You can always switch between
          modes at any time.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <Link
            href="/templates"
            className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <ArrowRight className="h-5 w-5 text-accent transition-transform group-hover:translate-x-0.5" />
            </div>
            <div>
              <h3 className="font-semibold text-text">Browse Templates</h3>
              <p className="mt-1 text-sm text-text-muted">
                Ready-made configurations for common setups. Perfect for getting
                started quickly.
              </p>
            </div>
          </Link>

          <Link
            href="/builder"
            className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 text-left transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-elevated">
              <ArrowRight className="h-5 w-5 text-text-muted transition-transform group-hover:translate-x-0.5" />
            </div>
            <div>
              <h3 className="font-semibold text-text">Build Custom Setup</h3>
              <p className="mt-1 text-sm text-text-muted">
                Pick individual resources and configure them one by one. Full
                flexibility.
              </p>
            </div>
          </Link>
        </div>

        <p className="mt-8 text-sm text-text-muted">
          Need help?{" "}
          <span className="text-accent">Contact your platform team.</span>
        </p>
      </motion.div>
    </section>
  );
}
