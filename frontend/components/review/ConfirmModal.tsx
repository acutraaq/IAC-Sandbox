"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Check, Copy, RotateCcw, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
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

function StatusBanner({ status, error }: { status: DeploymentStatus | null; error: string | null }) {
  if (!status) return null;

  const configs = {
    accepted: {
      icon: <Clock className="h-4 w-4 shrink-0" />,
      text: "Queued — waiting to start",
      className: "bg-surface border-border text-text-muted",
    },
    running: {
      icon: <Loader2 className="h-4 w-4 shrink-0 animate-spin" />,
      text: "Deploying to Azure…",
      className: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    },
    succeeded: {
      icon: <CheckCircle2 className="h-4 w-4 shrink-0" />,
      text: "Deployed successfully",
      className: "bg-green-500/10 border-green-500/30 text-green-400",
    },
    failed: {
      icon: <XCircle className="h-4 w-4 shrink-0" />,
      text: "Deployment failed",
      className: "bg-red-500/10 border-red-500/30 text-red-400",
    },
  };

  const { icon, text, className } = configs[status];

  return (
    <div className={`flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-sm ${className}`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{text}</span>
      </div>
      {status === "failed" && error && (
        <p className="ml-6 text-xs opacity-80">{error}</p>
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
      // Fallback: select text
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

        <StatusBanner status={deploymentStatus} error={deploymentError} />

        <div className="relative">
          <pre
            id="proof-text"
            className="max-h-64 overflow-auto rounded-lg border border-border bg-bg p-4 font-mono text-xs leading-relaxed text-text"
          >
            {proofText}
          </pre>
        </div>

        <div className="flex flex-col gap-3">
          <Button onClick={handleCopy} variant={copied ? "secondary" : "primary"} className="w-full">
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

          <Button
            asChild
            variant="ghost"
            className="w-full"
            onClick={onReset}
          >
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
