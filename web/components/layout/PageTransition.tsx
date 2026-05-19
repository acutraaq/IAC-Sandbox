"use client";

import { motion } from "framer-motion";
import { easeOutTransition, reducedMotionEnabled } from "@/lib/motion";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={reducedMotionEnabled ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={easeOutTransition}
      className="motion-reduce:animate-none"
    >
      {children}
    </motion.div>
  );
}
