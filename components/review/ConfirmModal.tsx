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
