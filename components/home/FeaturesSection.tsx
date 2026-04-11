"use client";

import { motion } from "framer-motion";
import { LayoutGrid, Settings, Send } from "lucide-react";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: LayoutGrid,
    title: "Choose",
    description:
      "Pick from ready-made templates for common setups, or build a custom configuration resource by resource.",
  },
  {
    icon: Settings,
    title: "Configure",
    description:
      "Answer a few simple questions about what you need. No technical expertise required — we guide you through it.",
  },
  {
    icon: Send,
    title: "Submit",
    description:
      "Review your choices and submit. You'll get a confirmation report you can share with your approver.",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t border-border bg-surface px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold text-text">How It Works</h2>
          <p className="mt-3 text-text-muted">
            Three simple steps to get your cloud resources up and running.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="flex flex-col gap-4 text-center">
                <div className="flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <feature.icon className="h-6 w-6 text-accent" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-text">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-text-muted">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
