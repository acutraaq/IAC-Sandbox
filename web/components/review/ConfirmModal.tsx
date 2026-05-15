"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Check, Copy, RotateCcw } from "lucide-react";
import Link from "next/link";

interface ConfirmModalProps {
  open: boolean;
  proofText: string;
  onClose: () => void;
  onReset: () => void;
}

export function ConfirmModal({
  open,
  proofText,
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
          Copy the proof below and submit it to your HOD for approval. Deployment is running in the background.
        </p>

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
