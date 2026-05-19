"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { NavLink } from "@/components/home/NavLink";
import { TerminalHero } from "@/components/home/TerminalHero";
import { MarqueeStrip } from "@/components/ui/MarqueeStrip";
import { NumberedBlock } from "@/components/ui/NumberedBlock";
import { ComparisonBar } from "@/components/ui/ComparisonBar";
import { BracketFeature } from "@/components/ui/BracketFeature";
import { AsciiTerminal } from "@/components/ui/AsciiTerminal";
import { FaqAccordion } from "@/components/ui/FaqAccordion";
import {
  fadeUpVariant,
  staggerContainer,
  easeOutTransition,
  reducedMotionEnabled,
} from "@/lib/motion";
import {
  ArrowRight,
  Layers,
  Puzzle,
  Clock,
  Zap,
  FileCheck,
  Lock,
  Eye,
} from "lucide-react";

const statItems = [
  { label: "Templates", value: "16", icon: Layers },
  { label: "Categories", value: "7", icon: Puzzle },
  { label: "Avg. Time", value: "~5 min", icon: Clock },
];

const marqueeItems = [
  "Zero policy risk",
  "Native deployment",
  "100% tag-compliant",
  "Fast provisioning",
  "No cloud expertise needed",
  "HOD approval ready",
  "Real-time tracking",
  "Policy blocked = safe",
  "Managed identity",
  "ARM-backed",
  "EPF teams only",
  "Audit-ready",
];

const problemBlocks = [
  {
    num: "001",
    title: "Manual approvals",
    desc: "Waiting on HOD sign-off slows every sprint. Paper trails and email chains add days to every resource request.",
  },
  {
    num: "002",
    title: "Azure complexity",
    desc: "Portal navigation and ARM templates are error-prone. One wrong property and your entire deployment fails silently.",
  },
  {
    num: "003",
    title: "Policy drift",
    desc: "Untagged resources silently violate subscription guardrails. Compliance audits become a nightmare of manual cleanup.",
  },
  {
    num: "004",
    title: "No visibility",
    desc: "Teams can't see what was deployed or why. Resource sprawl grows because nobody owns the lifecycle.",
  },
];

const comparisons = [
  {
    label: "How long does setup take?",
    leftLabel: "Azure Portal",
    rightLabel: "Sandbox",
    leftValue: 95,
    rightValue: 8,
    leftMeta: "~2 hours",
    rightMeta: "~5 minutes",
    improvement: "24× faster",
  },
  {
    label: "Are tags and policy rules enforced?",
    leftLabel: "Azure Portal",
    rightLabel: "Sandbox",
    leftValue: 35,
    rightValue: 100,
    leftMeta: "Done manually",
    rightMeta: "Always enforced",
    improvement: "Zero manual effort",
  },
  {
    label: "Is an HOD approval document ready?",
    leftLabel: "Azure Portal",
    rightLabel: "Sandbox",
    leftValue: 0,
    rightValue: 100,
    leftMeta: "You write it yourself",
    rightMeta: "Auto-generated",
    improvement: "Instant",
  },
  {
    label: "Can I see all my deployments in one place?",
    leftLabel: "Azure Portal",
    rightLabel: "Sandbox",
    leftValue: 25,
    rightValue: 100,
    leftMeta: "Scattered across portal",
    rightMeta: "My Stuff page",
    improvement: "Full visibility",
  },
];

const features = [
  {
    icon: Zap,
    title: "Fast setup",
    desc: "From idea to deployed resources in under 5 minutes.",
  },
  {
    icon: FileCheck,
    title: "HOD approval workflow",
    desc: "Auto-generated proof documents included with every request.",
  },
  {
    icon: Lock,
    title: "Policy safe",
    desc: "Blocked resource types are filtered before you even start.",
  },
  {
    icon: Eye,
    title: "Full visibility",
    desc: "Track every deployment and its live status at a glance.",
  },
];

const capabilities = [
  {
    title: "Understands your policy",
    desc: "Validates tags before submission. All 6 ARM tags are applied automatically — no manual entry, no drift.",
  },
  {
    title: "Prevents breakage",
    desc: "Blocked resource types are filtered out at the UI level. Policy-blocked templates show a lock icon before you invest time.",
  },
  {
    title: "Strategizes before acting",
    desc: "Review page with a printable proof artifact. Confirm every tag, every resource, every name before a single ARM call is made.",
  },
  {
    title: "Executes end-to-end",
    desc: "ARM deployment via System-Assigned Managed Identity. No credentials in code, no secrets in logs.",
  },
  {
    title: "Isolates by identity",
    desc: "Every resource group is tagged with deployedBy and iac-submissionId. Full traceability back to the submitting user.",
  },
  {
    title: "Runs at full speed",
    desc: "Queue-driven, async, non-blocking. Submit and move on — the Function App handles the rest in the background.",
  },
];

const faqItems = [
  {
    question: "What is Sandbox IAC?",
    answer:
      "Sandbox IAC is an internal Azure Infrastructure-as-Code deployment platform for EPF. It lets non-expert users configure and submit Azure infrastructure deployments through guided templates or a custom builder — no cloud expertise required.",
  },
  {
    question: "Who can use Sandbox?",
    answer:
      "Sandbox is designed for EPF teams who need Azure resources but don't have deep cloud expertise. If you can fill out a form, you can deploy infrastructure.",
  },
  {
    question: "How does deployment work?",
    answer:
      "You choose a template or build a custom config, fill in the required tags, review your setup, and submit. The request is queued and picked up by an Azure Function that creates your resource group and runs the ARM deployment via managed identity.",
  },
  {
    question: "What about HOD approval?",
    answer:
      "Every submission generates a plain-text proof artifact with all configuration details, tags, and resource names. Print it, attach it to your approval request, and you're done.",
  },
  {
    question: "Is my data safe?",
    answer:
      "Yes. Sandbox uses System-Assigned Managed Identity for all Azure operations. No credentials are stored in code or logs. All requests are authenticated and tagged with your identity.",
  },
  {
    question: "Where are resources deployed?",
    answer:
      "All deployments go to the sub-epf-sandbox-internal subscription in southeastasia. This is a controlled sandbox environment for safe experimentation.",
  },
];


export default function Home() {
  return (
    <div className="relative">
      {/* ===== SECTION 1: HERO ===== */}
      <motion.header
        initial={reducedMotionEnabled ? false : "hidden"}
        animate="visible"
        variants={staggerContainer}
        className="mx-auto max-w-7xl px-6 pt-6 pb-4 md:px-8 md:pt-10 md:pb-6 min-h-[calc(100dvh-4rem)] flex flex-col justify-center"
      >
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
          {/* Left: copy */}
          <div className="min-w-0">
            <motion.span
              variants={fadeUpVariant}
              transition={easeOutTransition}
              className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-accent"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-success animate-pulse motion-reduce:animate-none"
              />
              Sandbox is live
            </motion.span>

            <motion.h1
              variants={fadeUpVariant}
              transition={easeOutTransition}
              className="mt-6 font-sans text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-text"
            >
              Deploy Azure{" "}
              <span className="text-coral">infrastructure.</span>
              <br />
              No cloud expertise required.
            </motion.h1>

            <motion.p
              variants={fadeUpVariant}
              transition={easeOutTransition}
              className="mt-5 max-w-[52ch] text-base leading-relaxed text-text-muted md:text-lg"
            >
              Pick a template, answer a few questions, and let automation handle
              provisioning. Built for EPF teams — policy-safe by default.
            </motion.p>

            <motion.div
              variants={fadeUpVariant}
              transition={easeOutTransition}
              className="mt-7 flex flex-wrap gap-3"
            >
              <Button asChild size="lg">
                <Link href="/templates" className="no-underline">
                  Browse Templates
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <NavLink
                href="/builder"
                mode="custom"
                variant="outline-glow"
                size="lg"
              >
                Build Custom
              </NavLink>
            </motion.div>

            <motion.div
              variants={fadeUpVariant}
              transition={{ ...easeOutTransition, delay: 0.12 }}
              className="mt-8 flex flex-wrap gap-6"
            >
              {statItems.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <div
                    aria-hidden="true"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10"
                  >
                    <s.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-text leading-none">
                      {s.value}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-text-muted">
                      {s.label}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: terminal */}
          <motion.div
            variants={fadeUpVariant}
            transition={{ ...easeOutTransition, delay: 0.1 }}
            className="w-full min-w-0"
          >
            <div className="glow-border">
              <TerminalHero />
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* ===== SECTION 2: MARQUEE ===== */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 120% 60% at 50% 50%, rgba(90,65,30,0.04), transparent 60%)",
          }}
        />
        <MarqueeStrip items={marqueeItems} speed={35} />
      </section>

      {/* ===== SECTION 3: THE PROBLEM ===== */}
      <section className="relative border-y border-border/30 bg-bg-deep py-8 md:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-glow to-transparent" />
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <motion.div
            initial={reducedMotionEnabled ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUpVariant} transition={easeOutTransition}>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-coral">
                The problem
              </p>
              <h2 className="mt-2 font-sans text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.1] tracking-tight text-text">
                Provisioning shouldn&apos;t{" "}
                <span className="text-text-muted">be this hard.</span>
              </h2>
            </motion.div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {problemBlocks.map((b, i) => (
                <motion.div
                  key={b.num}
                  variants={fadeUpVariant}
                  transition={{ ...easeOutTransition, delay: i * 0.06 }}
                >
                  <NumberedBlock
                    number={b.num}
                    title={b.title}
                    description={b.desc}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border-glow to-transparent" />
      </section>

      {/* ===== SECTION 4: INTRODUCING SANDBOX ===== */}
      <section className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        <motion.div
          initial={reducedMotionEnabled ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} transition={easeOutTransition}>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-accent">
              Introducing sandbox
            </p>
            <h2 className="mt-2 font-sans text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.1] tracking-tight text-text">
              Everything automated.{" "}
              <span className="text-text-muted">Policy-safe by default.</span>
            </h2>
            <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-text-muted">
              Sandbox replaces the manual portal workflow with a guided,
              tag-validated, queue-driven deployment pipeline. Choose a template
              or build your own — every submission is validated, tracked, and
              traced back to you.
            </p>
          </motion.div>

          <div className="mt-8 grid grid-cols-1 items-center gap-6 lg:grid-cols-2">
            <motion.div
              variants={fadeUpVariant}
              transition={{ ...easeOutTransition, delay: 0.1 }}
            >
              <AsciiTerminal
                title="sandbox-diagram.sh"
                lines={[
                  { text: "# -- Traditional Azure Portal --", color: "muted" },
                  { text: "  1. Login to portal", color: "text" },
                  { text: "  2. Navigate to target service", color: "text" },
                  { text: "  3. Fill 20+ fields manually", color: "text" },
                  { text: "  4. Apply tags one-by-one", color: "text" },
                  { text: "  5. Export proof for HOD", color: "text" },
                  { text: "  6. Wait for review", color: "text" },
                  { text: "  ! High error rate, no audit trail", color: "muted" },
                  { text: "", color: "text" },
                  { text: "# -- Sandbox Pipeline --", color: "muted" },
                  { text: "  1. Pick template / builder", color: "accent" },
                  { text: "  2. Answer guided questions", color: "accent" },
                  { text: "  3. Validate all 6 tags", color: "accent" },
                  { text: "  4. Review + proof artifact", color: "accent" },
                  { text: "  5. Submit -> queue -> ARM", color: "accent" },
                  { text: "  v DeployedBy tagged, audit-ready", color: "success" },
                ]}
              />
            </motion.div>

            <motion.div
              variants={fadeUpVariant}
              transition={{ ...easeOutTransition, delay: 0.2 }}
              className="space-y-6"
            >
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-coral/10"
                  >
                    <f.icon className="h-5 w-5 text-coral" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-text">{f.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-muted">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ===== SECTION 5: COMPARISON BARS ===== */}
      <section className="relative border-y border-border/30 bg-bg-deep py-8 md:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-glow to-transparent" />
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <motion.div
            initial={reducedMotionEnabled ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUpVariant} transition={easeOutTransition}>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-coral">
                Cloud portal vs. sandbox
              </p>
              <h2 className="mt-2 font-sans text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.1] tracking-tight text-text">
                Built for teams,{" "}
                <span className="text-text-muted">not technicians.</span>
              </h2>
            </motion.div>

            <div className="mt-6 space-y-6">
              {comparisons.map((c, i) => (
                <motion.div
                  key={c.label}
                  variants={fadeUpVariant}
                  transition={{ ...easeOutTransition, delay: i * 0.06 }}
                >
                  <ComparisonBar
                    label={c.label}
                    leftLabel={c.leftLabel}
                    rightLabel={c.rightLabel}
                    leftValue={c.leftValue}
                    rightValue={c.rightValue}
                    leftMeta={c.leftMeta}
                    rightMeta={c.rightMeta}
                    improvement={c.improvement}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border-glow to-transparent" />
      </section>

      {/* ===== SECTION 6: CAPABILITIES ===== */}
      <section className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        <motion.div
          initial={reducedMotionEnabled ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} transition={easeOutTransition}>
            <p className="font-mono text-xs uppercase tracking-[0.12em] text-accent">
              Capabilities
            </p>
            <h2 className="mt-2 font-sans text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.1] tracking-tight text-text">
              Built for{" "}
              <span className="text-coral">control freaks.</span>
            </h2>
          </motion.div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                variants={fadeUpVariant}
                transition={{ ...easeOutTransition, delay: i * 0.05 }}
              >
                <BracketFeature
                  index={i + 1}
                  title={cap.title}
                  description={cap.desc}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ===== SECTION 7: TERMINAL ASCII ===== */}
      <section className="relative border-y border-border/30 bg-bg-deep py-8 md:py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-glow to-transparent" />
        <div className="mx-auto max-w-7xl px-6 md:px-8">
          <motion.div
            initial={reducedMotionEnabled ? false : "hidden"}
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeUpVariant} transition={easeOutTransition}>
              <p className="font-mono text-xs uppercase tracking-[0.12em] text-coral">
                What happens next
              </p>
              <h2 className="mt-2 font-sans text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-[1.1] tracking-tight text-text">
                Submit once.{" "}
                <span className="text-text-muted">We handle the rest.</span>
              </h2>
            </motion.div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
              <motion.div
                variants={fadeUpVariant}
                transition={{ ...easeOutTransition, delay: 0.1 }}
              >
                <AsciiTerminal
                  title="After you click Submit"
                  lines={[
                    { text: "── Step 1: Your request is received ─────────", color: "muted" },
                    { text: "  [✓] Details checked for completeness", color: "success" },
                    { text: "  [✓] All required tags filled in", color: "success" },
                    { text: "  [✓] Blocked resource types filtered out", color: "success" },
                    { text: "", color: "text" },
                    { text: "── Step 2: Resources are created for you ────", color: "muted" },
                    { text: "  [✓] Your workspace is set up automatically", color: "success" },
                    { text: "  [✓] Proof document generated for HOD", color: "success" },
                    { text: "  [✓] Everything tagged and tracked", color: "success" },
                    { text: "", color: "text" },
                    { text: "── Step 3: You are notified ─────────────────", color: "muted" },
                    { text: "  [✓] Status visible in My Stuff", color: "success" },
                    { text: "  [✓] Direct link to your new workspace", color: "success" },
                    { text: "", color: "text" },
                    { text: "  Ready in approximately 5 minutes.", color: "accent" },
                    { text: "  You can close this tab right now.", color: "muted" },
                  ]}
                />
              </motion.div>

              <motion.div
                variants={fadeUpVariant}
                transition={{ ...easeOutTransition, delay: 0.2 }}
                className="grid grid-cols-2 gap-4 content-start"
              >
                {[
                  { label: "No waiting", value: "Close the tab anytime" },
                  { label: "No expertise", value: "Guided step by step" },
                  { label: "No risk", value: "Policy checked upfront" },
                  { label: "Proof ready", value: "For HOD approval" },
                  { label: "Fully tracked", value: "See it in My Stuff" },
                  { label: "Takes about", value: "~5 minutes" },
                ].map((meta) => (
                  <div
                    key={meta.label}
                    className="rounded-lg border border-border bg-surface p-4"
                  >
                    <p className="text-[10px] uppercase tracking-wider text-text-faint">
                      {meta.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-text">
                      {meta.value}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border-glow to-transparent" />
      </section>

      {/* ===== SECTION 8: FAQ ===== */}
      <section className="mx-auto max-w-[clamp(42rem,60vw,48rem)] px-6 py-8 md:px-8 md:py-12">
        <motion.div
          initial={reducedMotionEnabled ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpVariant} transition={easeOutTransition}>
            <p className="text-center font-mono text-xs uppercase tracking-[0.12em] text-accent">
              FAQ
            </p>
            <h2 className="mt-3 text-center font-sans text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-text">
              Frequently asked{" "}
              <span className="text-coral">questions.</span>
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUpVariant}
            transition={{ ...easeOutTransition, delay: 0.1 }}
            className="mt-6"
          >
            <FaqAccordion items={faqItems} />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== SECTION 9: BOTTOM CTA ===== */}
      <section className="relative mx-6 mb-6 overflow-hidden rounded-2xl border border-border bg-surface p-6 text-center md:mx-8 md:p-8 md:mb-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(circle at 50% 0%, rgba(90,65,30,0.05), transparent 60%)",
          }}
        />

        <motion.div
          initial={reducedMotionEnabled ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={staggerContainer}
          className="relative"
        >
          <motion.div variants={fadeUpVariant} transition={easeOutTransition}>
            <h2 className="font-sans text-[clamp(1.75rem,4vw,2.5rem)] font-bold text-text">
              Ready when you are
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-base text-text-muted">
              Jump into templates, or request a custom setup if you need
              something specific.
            </p>
            <div className="relative mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/templates" className="no-underline">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <NavLink
                href="/request"
                mode="custom-request"
                variant="outline-glow"
                size="lg"
              >
                Request Custom Setup
              </NavLink>
            </div>
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
