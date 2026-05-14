"use client";

import { useEffect, useRef, useState } from "react";

interface Line {
  glyph: string;
  glyphClass: string;
  text: string;
  textClass: string;
}

interface Scenario {
  id: string;
  label: string;
  lines: Line[];
}

const COMMENT_GLYPH = ">";
const PROMPT_GLYPH = "$";
const CHECK_GLYPH = "✓";

function makeScenario(
  id: string,
  label: string,
  slug: string,
  templateName: string
): Scenario {
  return {
    id,
    label,
    lines: [
      {
        glyph: PROMPT_GLYPH,
        glyphClass: "text-amber",
        text: `sandbox init --template ${slug}`,
        textClass: "text-text",
      },
      {
        glyph: COMMENT_GLYPH,
        glyphClass: "text-comment",
        text: "scanning sub-epf-sandbox-internal",
        textClass: "text-text-muted",
      },
      {
        glyph: COMMENT_GLYPH,
        glyphClass: "text-comment",
        text: `selecting template: ${templateName}`,
        textClass: "text-text-muted",
      },
      {
        glyph: COMMENT_GLYPH,
        glyphClass: "text-comment",
        text: "applying tags: 6 keys",
        textClass: "text-text-muted",
      },
      {
        glyph: COMMENT_GLYPH,
        glyphClass: "text-comment",
        text: "queueing ARM deployment",
        textClass: "text-text-muted",
      },
      {
        glyph: CHECK_GLYPH,
        glyphClass: "text-amber",
        text: "deployment ready",
        textClass: "text-text",
      },
    ],
  };
}

const SCENARIOS: Scenario[] = [
  makeScenario("web", "web-app", "web-application", "web-application"),
  makeScenario("storage", "storage", "storage-account", "storage-account"),
  makeScenario("keyvault", "key-vault", "key-vault", "key-vault"),
  makeScenario("vnet", "vnet", "virtual-network", "virtual-network"),
];

const FIRST_DELAY = 220;
const STEP_DELAY = 480;
const HOLD_BEFORE_ADVANCE = 2200;

export function TerminalHero() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [runId, setRunId] = useState(0);
  const [visible, setVisible] = useState(0);
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const scenario = SCENARIOS[activeIdx];

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setVisible(0);
        setDone(false);
      }, 0)
    );

    if (reduce) {
      timers.push(
        setTimeout(() => {
          if (!cancelled) {
            setVisible(scenario.lines.length);
            setDone(true);
          }
        }, 0)
      );
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
      };
    }

    scenario.lines.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) setVisible(i + 1);
        }, FIRST_DELAY + i * STEP_DELAY)
      );
    });

    const settleAt = FIRST_DELAY + scenario.lines.length * STEP_DELAY + 200;
    timers.push(
      setTimeout(() => {
        if (!cancelled) setDone(true);
      }, settleAt)
    );

    const advanceAt = settleAt + HOLD_BEFORE_ADVANCE;
    timers.push(
      setTimeout(() => {
        if (cancelled || pausedRef.current) return;
        setActiveIdx((idx) => (idx + 1) % SCENARIOS.length);
      }, advanceAt)
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [scenario, runId]);

  function handleTabClick(i: number) {
    setActiveIdx(i);
    setRunId((n) => n + 1);
  }

  return (
    <div
      className="relative overflow-hidden rounded-md border border-border bg-surface"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at top right, var(--color-amber-glow), transparent 55%)",
        }}
      />

      <div className="relative flex items-center gap-1.5 border-b border-border bg-surface-elevated px-3 py-2">
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-text-faint/30" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-text-faint/30" />
        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-text-faint/30" />
        <span className="ml-2 font-mono text-[11px] text-text-faint">
          ~/sandbox/deploy.sh
        </span>
      </div>

      <div
        role="tablist"
        aria-label="Deployment scenarios"
        className="relative flex flex-wrap items-center gap-1 border-b border-border bg-surface/60 px-2 py-1.5"
      >
        {SCENARIOS.map((s, i) => {
          const active = i === activeIdx;
          return (
            <button
              key={s.id}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls="terminal-hero-output"
              onClick={() => handleTabClick(i)}
              className={`rounded-sm px-2 py-1 font-mono text-[11px] transition-colors ${
                active
                  ? "bg-amber/15 text-amber"
                  : "text-text-muted hover:bg-surface-elevated hover:text-text"
              }`}
            >
              {s.label}
            </button>
          );
        })}
        <span className="ml-auto font-mono text-[10px] text-text-faint">
          {paused ? "paused" : "auto"}
        </span>
      </div>

      <div
        id="terminal-hero-output"
        role="tabpanel"
        aria-live="polite"
        className="relative min-h-[230px] p-4 font-mono text-[13px] leading-[1.95] sm:p-5"
      >
        {scenario.lines.map((line, i) => {
          const shown = i < visible;
          const isCursorLine = !done && i === visible - 1;
          return (
            <div
              key={`${scenario.id}-${i}`}
              className={`transition-all duration-300 ease-out ${
                shown
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-1"
              }`}
            >
              <span className={`${line.glyphClass} select-none`}>
                {line.glyph}
              </span>{" "}
              <span className={line.textClass}>{line.text}</span>
              {isCursorLine && (
                <span
                  aria-hidden="true"
                  className="ml-1 inline-block h-[1em] w-[0.55em] translate-y-[2px] animate-pulse bg-amber align-middle motion-reduce:animate-none"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
