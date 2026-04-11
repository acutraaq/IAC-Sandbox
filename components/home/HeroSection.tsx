"use client";

import { useRef, useEffect } from "react";
import { motion, useInView, animate, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowUpRight } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

interface StatDef {
  value: number | string;
  label: string;
}

const stats: StatDef[] = [
  { value: 8, label: "Templates ready" },
  { value: 8, label: "Resource types" },
  { value: "~5 min", label: "Avg. deployment" },
  { value: "Zero", label: "CLI required" },
];

interface Ring {
  size: number;
  opacity: number;
  duration?: string;
  delay?: string;
}

const rings: Ring[] = [
  { size: 288, opacity: 0.055, duration: "7s", delay: "0s" },
  { size: 220, opacity: 0.08, duration: "9s", delay: "-2.5s" },
  { size: 152, opacity: 0.11, duration: "11s", delay: "-5s" },
  { size: 92, opacity: 0.14 },
  { size: 40, opacity: 0.18 },
];

export function HeroSection() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col justify-center overflow-hidden px-6 py-24">
      {/* Ambient radial glow — slow fade-in, then static */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.5, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 22% 58%, rgba(0, 120, 212, 0.09) 0%, transparent 70%)",
        }}
      />

      {/* Right-side decorative target rings — desktop only */}
      <TargetRings />

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto w-full max-w-6xl"
      >
        {/* Terminal label + blinking cursor */}
        <motion.p
          variants={item}
          className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-text-muted"
        >
          <span className="text-accent" aria-hidden="true">■</span>
          &ensp;Azure Infrastructure Platform&ensp;/&ensp;v1.0
          <span className="animate-cursor-blink ml-0.5 inline-block" aria-hidden="true">
            _
          </span>
        </motion.p>

        {/* Headline */}
        <motion.h1
          variants={item}
          className="font-display max-w-3xl text-6xl font-extrabold leading-[1.02] tracking-tight text-text sm:text-7xl lg:text-8xl"
        >
          Deploy Azure
          <br />
          <span className="text-accent">Cloud Resources</span>
          <br />
          <span className="text-text-muted">Without&nbsp;Code.</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={item}
          className="mt-8 max-w-md text-base leading-relaxed text-text-muted"
        >
          Pick a ready-made template or build your own resource
          configuration — submit for HOD approval in minutes, no
          command&nbsp;line&nbsp;required.
        </motion.p>

        {/* CTAs */}
        <motion.div
          variants={item}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Button size="lg" asChild>
            <Link href="/templates" className="flex items-center gap-2">
              Browse Templates
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/builder">Build Custom</Link>
          </Button>
        </motion.div>

        {/* Stats row — numeric values count up on first view */}
        <motion.div
          variants={item}
          className="mt-16 flex flex-wrap gap-x-10 gap-y-5 border-t border-border pt-8"
        >
          {stats.map((stat) => (
            <StatItem key={stat.label} {...stat} />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ── Count-up stat item ── */
function StatItem({ value, label }: StatDef) {
  const isNumeric = typeof value === "number";
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true });
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!isNumeric || !ref.current) return;
    if (prefersReduced || !inView) {
      ref.current.textContent = String(value);
      return;
    }
    const controls = animate(0, value as number, {
      duration: 1.2,
      ease: [0.33, 1, 0.68, 1],
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.round(v).toString();
      },
    });
    return () => controls.stop();
  }, [isNumeric, inView, value, prefersReduced]);

  return (
    <div>
      <p ref={ref} className="font-display text-2xl font-bold text-text">
        {isNumeric ? "0" : value}
      </p>
      <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
        {label}
      </p>
    </div>
  );
}

/* ── Decorative breathing target rings ── */
function TargetRings() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 lg:block"
    >
      <div className="relative flex h-72 w-72 items-center justify-center">
        {rings.map(({ size, opacity, duration, delay }) => (
          <div
            key={size}
            className={`absolute rounded-full border border-accent${duration ? " animate-ring-breathe" : ""}`}
            style={{
              width: size,
              height: size,
              opacity,
              ...(duration
                ? { animationDuration: duration, animationDelay: delay ?? "0s" }
                : {}),
            }}
          />
        ))}
        {/* Crosshairs */}
        <div className="absolute h-px w-64 bg-accent" style={{ opacity: 0.07 }} />
        <div className="absolute h-64 w-px bg-accent" style={{ opacity: 0.07 }} />
        {/* Center dot */}
        <div
          className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent"
          style={{ opacity: 0.4 }}
        />
      </div>
    </div>
  );
}
