"use client";

interface TerminalLine {
  text: string;
  color?: "prompt" | "text" | "success" | "muted" | "accent";
}

interface AsciiTerminalProps {
  title?: string;
  lines: TerminalLine[];
  asciiArt?: string;
  className?: string;
}

const LINE_COLOR: Record<string, string> = {
  prompt:  "var(--term-accent)",
  text:    "var(--term-text)",
  success: "var(--term-success)",
  muted:   "var(--term-muted)",
  accent:  "var(--term-accent)",
};

export function AsciiTerminal({ title, lines, asciiArt, className }: AsciiTerminalProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border shadow-lg ${className ?? ""}`}
      style={{ background: "var(--term-bg)", borderColor: "var(--term-border)" }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-0 border-b px-4 py-2.5"
        style={{ background: "var(--term-bg-deep)", borderColor: "var(--term-border)" }}
      >
        <div className="flex items-center gap-1.5 mr-3">
          <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: "#FF5F57" }} />
          <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: "#FFBD2E" }} />
          <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: "#28C840" }} />
        </div>
        {title && (
          <span className="font-mono text-xs" style={{ color: "var(--term-muted)" }}>
            {title}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="p-4 font-mono text-[12px] leading-[1.8] sm:p-5 sm:text-[12px]">
        {asciiArt && (
          <pre
            className="mb-4 leading-[1.5] overflow-x-auto"
            style={{ color: "var(--term-dim)", fontSize: "10px" }}
          >
            {asciiArt}
          </pre>
        )}
        {lines.map((line, i) => (
          <div key={i} style={{ color: LINE_COLOR[line.color ?? "text"] ?? LINE_COLOR.text }}>
            {line.text || " "}
          </div>
        ))}
      </div>
    </div>
  );
}
