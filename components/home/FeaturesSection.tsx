"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Choose",
    description:
      "Pick from ready-made templates for common setups, or build a custom configuration resource by resource.",
  },
  {
    number: "02",
    title: "Configure",
    description:
      "Answer simple questions about what you need. No technical expertise required — we guide you through every field.",
  },
  {
    number: "03",
    title: "Submit",
    description:
      "Review your choices and submit. A confirmation report is generated for HOD approval outside this system.",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-y border-border bg-surface px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Section label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-text-muted">
            Process
          </p>
          <h2 className="font-display text-4xl font-bold text-text">
            How it works
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col gap-4 px-0 py-8 first:pt-0 last:pb-0 sm:px-8 sm:py-0 sm:first:pl-0 sm:last:pr-0"
            >
              {/* Large step number — purely decorative, gives depth */}
              <p
                aria-hidden="true"
                className="font-display select-none text-[5.5rem] font-extrabold leading-none text-border"
              >
                {step.number}
              </p>
              <div>
                <h3 className="font-display mb-2.5 text-xl font-semibold text-text">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
