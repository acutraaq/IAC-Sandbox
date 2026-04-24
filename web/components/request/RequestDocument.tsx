"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { SelectedResource } from "@/types";

interface RequestDocumentProps {
  resources: SelectedResource[];
  onReset: () => void;
}

function generateRequestText(resources: SelectedResource[]): string {
  const now = new Date().toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    dateStyle: "full",
    timeStyle: "short",
  });
  const requestId = crypto.randomUUID().slice(0, 8).toUpperCase();

  const resourceLines = resources
    .map((r, i) => {
      const configLines = Object.entries(r.config)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([k, v]) => `      ${k}: ${String(v)}`)
        .join("\n");
      return `  Resource ${i + 1}: ${r.name} (${r.type})${configLines ? `\n    Config:\n${configLines}` : ""}`;
    })
    .join("\n");

  return [
    "SANDBOX CUSTOM DEPLOYMENT REQUEST",
    "==================================",
    `Request ID    : REQ-${requestId}`,
    `Requested By  : EPF User`,
    `Date/Time     : ${now}`,
    "",
    "Requested Resources:",
    resourceLines,
    "",
    "──────────────────────────────────",
    "Please email this to the IAC team for provisioning.",
    "HOD approval is required before any resource is deployed.",
  ].join("\n");
}

export function RequestDocument({ resources, onReset }: RequestDocumentProps) {
  const [copied, setCopied] = useState(false);
  const text = generateRequestText(resources);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById("request-doc-text");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <div>
        <h2 className="text-base font-semibold text-text">Your Custom Request</h2>
        <p className="mt-1 text-sm text-text-muted">
          Copy this text and email it to the IAC team. They will review and
          provision the resources after HOD approval is obtained.
        </p>
      </div>

      <pre
        id="request-doc-text"
        className="max-h-72 overflow-auto rounded-lg border border-border bg-bg p-4 font-mono text-xs leading-relaxed text-text"
      >
        {text}
      </pre>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleCopy}
          variant={copied ? "secondary" : "primary"}
          className="w-full"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-success" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </>
          )}
        </Button>

        <Button variant="ghost" className="w-full" onClick={onReset}>
          Start a New Request
        </Button>
      </div>
    </div>
  );
}
