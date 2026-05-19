"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Line types ────────────────────────────────────────────────────────────────
type LineKind = "cmd" | "info" | "success" | "error" | "tag" | "blank" | "divider";

interface Line {
  kind: LineKind;
  text: string;
  tag?: string; // for kind="tag": label portion
}

interface Scenario {
  id: string;
  label: string;
  slug: string;
  lines: Line[];
}

// ── Scenarios ─────────────────────────────────────────────────────────────────
const SCENARIOS: Scenario[] = [
  {
    id: "web",
    label: "web-app",
    slug: "web-application",
    lines: [
      { kind: "cmd",     text: "sandbox deploy --template web-application" },
      { kind: "info",    text: "Scanning sub-epf-sandbox-internal ..." },
      { kind: "info",    text: "Template   : Web Application (App Service)" },
      { kind: "info",    text: "Resources  : App Service Plan + Web App" },
      { kind: "info",    text: "Region     : southeastasia" },
      { kind: "divider", text: "" },
      { kind: "tag",     tag: "Cost Center  ", text: "CC-EPF-PROD" },
      { kind: "tag",     tag: "Project ID   ", text: "PRJ-2026-001" },
      { kind: "tag",     tag: "Project Owner", text: "admin@epf.gov.my" },
      { kind: "tag",     tag: "Expiry Date  ", text: "2026-12-31" },
      { kind: "divider", text: "" },
      { kind: "success", text: "Submitted → rg-webapp-a3f8c2-rg" },
      { kind: "info",    text: "ARM status : Accepted · Running" },
    ],
  },
  {
    id: "storage",
    label: "storage",
    slug: "storage-account",
    lines: [
      { kind: "cmd",     text: "sandbox deploy --template storage-account" },
      { kind: "info",    text: "Scanning sub-epf-sandbox-internal ..." },
      { kind: "info",    text: "Template   : File Storage (Blob + Queue)" },
      { kind: "info",    text: "Resources  : Storage Account (LRS)" },
      { kind: "info",    text: "Region     : malaysiawest" },
      { kind: "divider", text: "" },
      { kind: "tag",     tag: "Cost Center  ", text: "CC-EPF-DATA" },
      { kind: "tag",     tag: "Project ID   ", text: "PRJ-2026-007" },
      { kind: "tag",     tag: "Project Owner", text: "data@epf.gov.my" },
      { kind: "tag",     tag: "Expiry Date  ", text: "2027-06-30" },
      { kind: "divider", text: "" },
      { kind: "success", text: "Submitted → rg-storage-b7e1d4-rg" },
      { kind: "info",    text: "ARM status : Accepted · Running" },
    ],
  },
  {
    id: "kv",
    label: "key-vault",
    slug: "key-vault",
    lines: [
      { kind: "cmd",     text: "sandbox deploy --template key-vault" },
      { kind: "info",    text: "Scanning sub-epf-sandbox-internal ..." },
      { kind: "info",    text: "Template   : Key Vault (Standard tier)" },
      { kind: "info",    text: "Resources  : Key Vault + RBAC policies" },
      { kind: "info",    text: "Region     : southeastasia" },
      { kind: "divider", text: "" },
      { kind: "tag",     tag: "Cost Center  ", text: "CC-EPF-SEC" },
      { kind: "tag",     tag: "Project ID   ", text: "PRJ-2026-012" },
      { kind: "tag",     tag: "Project Owner", text: "infra@epf.gov.my" },
      { kind: "tag",     tag: "Expiry Date  ", text: "2026-12-31" },
      { kind: "divider", text: "" },
      { kind: "success", text: "Submitted → rg-keyvault-c9a2e5-rg" },
      { kind: "info",    text: "ARM status : Accepted · Running" },
    ],
  },
  {
    id: "vnet",
    label: "vnet",
    slug: "virtual-network",
    lines: [
      { kind: "cmd",     text: "sandbox deploy --template virtual-network" },
      { kind: "info",    text: "Scanning sub-epf-sandbox-internal ..." },
      { kind: "info",    text: "Template   : Virtual Network (10.0.0.0/16)" },
      { kind: "info",    text: "Resources  : VNet + default subnet" },
      { kind: "info",    text: "Region     : malaysiawest" },
      { kind: "divider", text: "" },
      { kind: "tag",     tag: "Cost Center  ", text: "CC-EPF-NET" },
      { kind: "tag",     tag: "Project ID   ", text: "PRJ-2026-003" },
      { kind: "tag",     tag: "Project Owner", text: "net@epf.gov.my" },
      { kind: "tag",     tag: "Expiry Date  ", text: "2027-03-31" },
      { kind: "divider", text: "" },
      { kind: "success", text: "Submitted → rg-vnet-d4b6f1-rg" },
      { kind: "info",    text: "ARM status : Accepted · Running" },
    ],
  },
];

// ── Timing ────────────────────────────────────────────────────────────────────
const FIRST_DELAY = 180;
const STEP_DELAY  = 360;
const HOLD        = 2600;

// ── Colour helpers ────────────────────────────────────────────────────────────
function lineColor(kind: LineKind) {
  switch (kind) {
    case "cmd":     return "text-[#EAD9C0]";
    case "info":    return "text-[#B09070]";
    case "success": return "text-[#7A9A40]";
    case "error":   return "text-[#F87171]";
    case "tag":     return "text-[#C47820]";
    default:        return "text-transparent";
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export function TerminalHero() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [runId,    setRunId]   = useState(0);
  const [visible,  setVisible] = useState(0);
  const [done,     setDone]    = useState(false);
  const [paused,   setPaused]  = useState(false);
  const pausedRef = useRef(paused);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const scenario = SCENARIOS[activeIdx];

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(setTimeout(() => {
      if (!cancelled) { setVisible(0); setDone(false); }
    }, 0));

    if (reduce) {
      timers.push(setTimeout(() => {
        if (!cancelled) { setVisible(scenario.lines.length); setDone(true); }
      }, 0));
      return () => { cancelled = true; timers.forEach(clearTimeout); };
    }

    scenario.lines.forEach((_, i) => {
      timers.push(setTimeout(
        () => { if (!cancelled) setVisible(i + 1); },
        FIRST_DELAY + i * STEP_DELAY
      ));
    });

    const settleAt = FIRST_DELAY + scenario.lines.length * STEP_DELAY + 160;
    timers.push(setTimeout(() => { if (!cancelled) setDone(true); }, settleAt));
    timers.push(setTimeout(() => {
      if (cancelled || pausedRef.current) return;
      setActiveIdx((idx) => (idx + 1) % SCENARIOS.length);
    }, settleAt + HOLD));

    return () => { cancelled = true; timers.forEach(clearTimeout); };
  }, [scenario, runId]);

  function handleTabClick(i: number) {
    setActiveIdx(i);
    setRunId((n) => n + 1);
  }

  const lastSuccess = scenario.lines.findLast((l) => l.kind === "success");
  const submitted = done && !!lastSuccess;

  return (
    <div
      className="relative overflow-hidden rounded-xl border border-border shadow-2xl"
      style={{ background: "#1E1208" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* ── Window chrome ── */}
      <div
        className="flex items-center gap-0 border-b px-4 py-2.5"
        style={{ background: "#160E05", borderColor: "rgba(160,100,40,0.22)" }}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-1.5 mr-3">
          <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: "#FF5F57" }} />
          <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: "#FFBD2E" }} />
          <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: "#28C840" }} />
        </div>

        {/* Session title */}
        <span className="flex-1 text-center font-mono text-[11px]" style={{ color: "#7A6040" }}>
          epf@sandbox — bash
        </span>

        {/* Status pill */}
        <span
          className="font-mono text-[10px] px-2 py-0.5 rounded"
          style={{ background: "rgba(180,100,20,0.12)", color: paused ? "#7A6040" : "#C47820" }}
        >
          {paused ? "paused" : "● live"}
        </span>
      </div>

      {/* ── Tab bar ── */}
      <div
        role="tablist"
        aria-label="Deployment scenarios"
        className="flex items-center gap-0 overflow-x-auto border-b"
        style={{ background: "#1A1008", borderColor: "rgba(160,100,40,0.15)" }}
      >
        {SCENARIOS.map((s, i) => {
          const active = i === activeIdx;
          return (
            <button
              key={s.id}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls="terminal-output"
              onClick={() => handleTabClick(i)}
              className="relative shrink-0 px-4 py-2 font-mono text-[11px] transition-colors duration-150"
              style={{
                color: active ? "#EAD9C0" : "#5A4028",
                background: active ? "#1E1208" : "transparent",
                borderRight: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {active && (
                <motion.span
                  layoutId="tab-indicator"
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-[2px]"
                  style={{ background: "#C47820" }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ── Terminal body ── */}
      <div
        id="terminal-output"
        role="tabpanel"
        aria-live="polite"
        className="min-h-[260px] p-4 font-mono text-[12px] leading-[1.8] md:min-h-[300px] md:p-5"
        style={{ color: "#B09070" }}
      >
        {/* Prompt line */}
        <div className="mb-1 flex flex-wrap items-baseline gap-0">
          <span style={{ color: "#7A9A40" }}>epf</span>
          <span style={{ color: "#5A4028" }}>@</span>
          <span style={{ color: "#C47820" }}>sandbox</span>
          <span style={{ color: "#5A4028" }}>:~</span>
          <span style={{ color: "#7A9A40" }} className="mr-2">$</span>
          {/* Command types out on first line */}
          <AnimatePresence mode="wait">
            <motion.span
              key={scenario.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ color: "#EAD9C0" }}
            >
              {scenario.lines.find((l) => l.kind === "cmd")?.text ?? ""}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Output lines (skip the cmd line — already shown above) */}
        {scenario.lines.filter((l) => l.kind !== "cmd").map((line, i) => {
          const lineIdx = i + 1; // offset because cmd is rendered separately
          const shown = lineIdx < visible;

          if (line.kind === "blank" || line.kind === "divider") {
            return shown ? <div key={`${scenario.id}-div-${i}`} className="h-2" /> : null;
          }

          return (
            <motion.div
              key={`${scenario.id}-${i}`}
              initial={{ opacity: 0, x: -4 }}
              animate={shown ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-baseline"
            >
              {line.kind === "tag" ? (
                <>
                  <span className="mr-2 select-none" style={{ color: "#4A3018" }}>│</span>
                  <span style={{ color: "#7A6040" }} className="mr-2 shrink-0">{line.tag}</span>
                  <span style={{ color: "#C47820" }}>{line.text}</span>
                </>
              ) : (
                <>
                  <span className={`mr-2 select-none shrink-0 ${lineColor(line.kind)}`}>
                    {line.kind === "success" ? "✓" : line.kind === "error" ? "✗" : "→"}
                  </span>
                  <span className={lineColor(line.kind)}>{line.text}</span>
                </>
              )}

              {/* Blinking cursor on the last visible line */}
              {!done && lineIdx === visible - 1 && (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block h-[0.85em] w-[0.55em] animate-terminal-cursor-blink align-middle motion-reduce:animate-none"
                  style={{ background: "#EAD9C0", opacity: 0.9 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Status bar ── */}
      <div
        className="flex items-center justify-between border-t px-4 py-1.5"
        style={{ background: "#160E05", borderColor: "rgba(160,100,40,0.15)" }}
      >
        <span className="font-mono text-[10px]" style={{ color: "#4A3018" }}>
          sub-epf-sandbox-internal · southeastasia
        </span>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.span
              key="submitted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-[10px] px-2 py-0.5 rounded"
              style={{ background: "rgba(100,140,40,0.12)", color: "#7A9A40" }}
            >
              ● ARM running
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-mono text-[10px]"
              style={{ color: "#4A3018" }}
            >
              {done ? "complete" : "deploying..."}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
