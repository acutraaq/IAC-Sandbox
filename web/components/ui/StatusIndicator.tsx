"use client";

import { motion } from "framer-motion";
import type { DeploymentStatus } from "@/types";

interface StatusIndicatorProps {
  status: DeploymentStatus;
  size?: "sm" | "md";
}

export function StatusIndicator({ status, size = "sm" }: StatusIndicatorProps) {
  const dim = size === "md" ? "h-4 w-4" : "h-2.5 w-2.5";

  switch (status) {
    case "succeeded":
      return (
        <div className={`relative ${dim}`}>
          <svg viewBox="0 0 16 16" fill="none" className="h-full w-full">
            <circle cx="8" cy="8" r="7" className="fill-success/15" />
            <motion.path
              d="M4.5 8.5 L7 11 L11.5 5"
              stroke="currentColor"
              className="text-success"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
        </div>
      );

    case "failed":
      return (
        <motion.div
          className={`relative ${dim} rounded-full bg-error/15 flex items-center justify-center`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
        >
          <svg viewBox="0 0 16 16" fill="none" className="h-full w-full p-0.5">
            <motion.path
              d="M5 5 L11 11 M11 5 L5 11"
              stroke="currentColor"
              className="text-error"
              strokeWidth="1.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
        </motion.div>
      );

    case "running":
      return (
        <div className={`relative ${dim}`}>
          <svg viewBox="0 0 16 16" fill="none" className="h-full w-full animate-spin motion-reduce:animate-none">
            <circle cx="8" cy="8" r="7" className="stroke-accent/15" strokeWidth="1.5" />
            <path
              d="M8 1 A7 7 0 0 1 15 8"
              className="stroke-accent"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      );

    default: // queued / accepted
      return (
        <div className={`relative ${dim}`}>
          <motion.div
            className="h-full w-full rounded-full bg-warning/20"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-0 m-auto rounded-full bg-warning"
            style={{ width: "40%", height: "40%" }}
            animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
          />
        </div>
      );
  }
}
