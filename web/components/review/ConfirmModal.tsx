"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Check, Copy, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { DeploymentStatus } from "@/types";

interface ConfirmModalProps {
  open: boolean;
  proofText: string;
  deploymentStatus: DeploymentStatus | null;
  deploymentError: string | null;
  onClose: () => void;
  onReset: () => void;
}

const TIMELINE_STEPS = ["Queued", "Provisioning", "Deploying", "Complete"];

function activeStepIndex(status: DeploymentStatus | null): number {
  switch (status) {
    case "accepted":  return 0;
    case "running":   return 2;
    case "succeeded":
    case "failed":    return 3;
    default:          return 0;
  }
}

type StepState = "done" | "active" | "pending" | "failed";

interface TimelineStepProps {
  label: string;
  state: StepState;
  isLast: boolean;
}

function TimelineStep({ label, state, isLast }: TimelineStepProps) {
  const dotClass =
    state === "failed"
      ? "bg-error"
      : state === "done" || state === "active"
      ? "bg-primary"
      : "border-2 border-border bg-surface";

  const labelClass =
    state === "failed"
      ? "text-error font-medium"
      : state === "active"
      ? "text-text font-medium"
      : state === "done"
      ? "text-text"
      : "text-text-muted";

  return (
    <li
      data-active={state === "active" ? "" : undefined}
      data-failed={state === "failed" ? "" : undefined}
      className="flex flex-col items-start gap-1.5"
      style={{ flex: isLast ? "0 0 auto" : 1 }}
    >
      <div className="flex w-full items-center">
        <span
          aria-hidden="true"
          className={`flex h-3 w-3 shrink-0 rounded-full transition-colors ${dotClass} ${
            state === "active"
              ? "animate-pulse motion-reduce:animate-none"
              : ""
          }`}
        />
        {!isLast && (
          <span
            aria-hidden="true"
            className={`h-px flex-1 transition-colors ${
              state === "done" ? "bg-primary" : "bg-border"
            }`}
          />
        )}
      </div>
      <span className={`text-xs ${labelClass}`}>{label}</span>
    </li>
  );
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
    <div className="space-y-2">
      <ol className="flex w-full items-start">
        {TIMELINE_STEPS.map((label, i) => {
          let state: StepState;
          if (status === "failed" && i === 3) {
            state = "failed";
          } else if (i < activeIdx) {
            state = "done";
          } else if (i === activeIdx) {
            state = "active";
          } else {
            state = "pending";
          }
          return (
            <TimelineStep
              key={label}
              label={label}
              state={state}
              isLast={i === TIMELINE_STEPS.length - 1}
            />
          );
        })}
      </ol>
      {status === "failed" && error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}

export function ConfirmModal({
  open,
  proofText,
  deploymentStatus,
  deploymentError,
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
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Your deployment has been submitted. Copy the text below and share it
          with your approver for HOD sign-off.
        </p>

        {deploymentStatus && (
          <StatusTimeline status={deploymentStatus} error={deploymentError} />
        )}

        <div className="relative">
          <pre
            id="proof-text"
            className="max-h-64 overflow-auto rounded-lg border border-border bg-bg p-4 font-mono text-xs leading-relaxed text-text"
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

          <Button asChild variant="ghost" className="w-full" onClick={onReset}>
            <Link href="/">
              <RotateCcw className="h-4 w-4" />
              Start New Deployment
            </Link>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
