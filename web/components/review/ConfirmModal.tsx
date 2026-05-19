"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Check, Copy, RotateCcw } from "lucide-react";
import Link from "next/link";
import {
  staggerContainer,
  fadeUpVariant,
  easeOutTransition,
  reducedMotionEnabled,
} from "@/lib/motion";

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
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

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
      <motion.div
        initial={reducedMotionEnabled ? false : "hidden"}
        animate="visible"
        variants={staggerContainer}
        className="mx-auto max-w-xl space-y-4"
      >
        <motion.p
          variants={fadeUpVariant}
          transition={easeOutTransition}
          className="font-mono text-xs text-text-muted"
        >
          <span className="text-comment"># </span>
          Copy the proof below and submit it to your HOD for approval. Deployment is running in the background.
        </motion.p>

        <motion.div
          variants={fadeUpVariant}
          transition={easeOutTransition}
          className="relative"
        >
          <pre
            id="proof-text"
            className="max-h-48 overflow-auto rounded-md border border-border bg-bg p-3 font-mono text-[11px] leading-relaxed text-text sm:max-h-64 sm:p-4 sm:text-xs"
          >
            {proofText}
          </pre>
        </motion.div>

        <motion.div
          variants={fadeUpVariant}
          transition={easeOutTransition}
          className="flex flex-col gap-3"
        >
          <Button
            onClick={handleCopy}
            variant={copied ? "secondary" : "primary"}
            className="w-full"
          >
            <motion.div
              className="inline-flex items-center justify-center gap-2"
              initial={false}
              animate={{ opacity: 1 }}
              key={copied ? "copied" : "copy"}
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
            </motion.div>
          </Button>

          <Button asChild variant="ghost" className="w-full">
            <Link href="/" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
              Start New Deployment
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </Modal>
  );
}
