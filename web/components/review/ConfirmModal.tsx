"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Check, Copy, RotateCcw, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getPublicAzureEnv } from "@/lib/env-public";
import type { DeploymentStatus } from "@/types";

interface ConfirmModalProps {
  open: boolean;
  proofText: string;
  deploymentStatus: DeploymentStatus | null;
  deploymentError: string | null;
  resourceGroup: string | null;
  onClose: () => void;
  onReset: () => void;
}

const TIMELINE_STEPS = ["Submitted", "Deploying", "Complete"];

function activeStepIndex(status: DeploymentStatus | null): number {
  switch (status) {
    case "accepted":  return 0;
    case "running":   return 1;
    case "succeeded":
    case "failed":    return 2;
    default:          return 0;
  }
}

function StatusTimeline({
  status,
  error,
}: {
  status: DeploymentStatus | null;
  error: string | null;
}) {
  const activeIdx = activeStepIndex(status);
  return (
    <ol className="font-mono text-xs leading-relaxed">
      {TIMELINE_STEPS.map((label, i) => {
        let glyph: string;
        let className: string;
        const isActive = i === activeIdx;
        const isFailed = status === "failed" && i === TIMELINE_STEPS.length - 1;
        const isDone = i < activeIdx;
        if (isFailed) {
          glyph = "[x]";
          className = "text-error font-medium";
        } else if (isDone) {
          glyph = "[✓]";
          className = "text-success";
        } else if (isActive) {
          glyph = "[*]";
          className = "text-accent font-medium animate-pulse motion-reduce:animate-none";
        } else {
          glyph = "[ ]";
          className = "text-text-muted";
        }
        return (
          <li
            key={label}
            data-active={isActive && !isFailed ? "" : undefined}
            data-failed={isFailed ? "" : undefined}
            className={className}
          >
            <span className="select-none">{glyph}</span>{" "}
            <span>{label}</span>
          </li>
        );
      })}
      {status === "failed" && error && (
        <p className="mt-2 text-xs text-error font-sans">{error}</p>
      )}
    </ol>
  );
}

export function ConfirmModal({
  open,
  proofText,
  deploymentStatus,
  deploymentError,
  resourceGroup,
  onClose,
  onReset,
}: ConfirmModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(proofText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById("proof-text");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Deployment Submitted">
      <div className="mx-auto max-w-xl space-y-4">
        <p className="font-mono text-xs text-text-muted">
          <span className="text-comment"># </span>
          Copy the text below and share it with your approver for HOD sign-off.
        </p>

        {deploymentStatus && (
          <div aria-live="polite" aria-atomic="true" className="rounded-md border border-border bg-bg/50 p-3">
            <StatusTimeline status={deploymentStatus} error={deploymentError} />
          </div>
        )}

        <div className="relative">
          <pre
            id="proof-text"
            className="max-h-48 overflow-auto rounded-md border border-border bg-bg p-3 font-mono text-[11px] leading-relaxed text-text sm:max-h-64 sm:p-4 sm:text-xs"
          >
            {proofText}
          </pre>
        </div>

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

          {deploymentStatus === "succeeded" && resourceGroup && (
            <Link
              href={`https://portal.azure.com/#@/${getPublicAzureEnv().tenantId}/resource/subscriptions/${getPublicAzureEnv().subscriptionId}/resourceGroups/${resourceGroup}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-accent transition-all hover:bg-surface-elevated hover:border-accent/30"
            >
              <ExternalLink className="h-4 w-4" />
              View in Azure Portal
            </Link>
          )}

          <Button asChild variant="ghost" className="w-full">
            <Link href="/" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
              Start New Deployment
            </Link>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
