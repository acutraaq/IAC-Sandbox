/**
 * Shared Framer Motion variants for consistent UX across the app.
 * Always respect reduced-motion via `prefersReducedMotion` checks.
 */

import { Variants } from "framer-motion";

export const reducedMotionEnabled =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export const fadeInVariant: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleInVariant: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export const slideInRightVariant: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const staggerContainerSlow: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 24,
};

export const easeOutTransition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const easeOutSlow = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
};
