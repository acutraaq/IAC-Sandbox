"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { usePathname } from "next/navigation";
import { motion, useScroll } from "framer-motion";
import { Box } from "lucide-react";

const navLinks = [
  { href: "/templates", label: "Templates" },
  { href: "/builder", label: "Builder" },
];

export function Nav() {
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" aria-label="Main navigation">
      {/* 1px accent top bar */}
      <div className="h-px bg-accent" aria-hidden="true" />

      {/* Nav body — `relative` needed for the progress bar child */}
      <div className="relative border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-[63px] max-w-6xl items-center justify-between px-6">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3 text-text transition-colors"
            aria-label="Sandbox home"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
              {/* Decorative background glow on hover */}
              <div
                className="absolute inset-0 scale-75 rounded-lg bg-accent/20 blur-[2px] transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent/30"
                aria-hidden="true"
              />
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-accent/30 bg-surface-elevated shadow-sm transition-all duration-300 group-hover:border-accent group-hover:shadow-accent/10">
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Box
                    className="h-4.5 w-4.5 text-accent"
                    strokeWidth={2.5}
                    aria-hidden="true"
                  />
                </motion.div>
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-base font-extrabold tracking-tight text-text">
                Sandbox
              </span>
              <span className="hidden font-mono text-[8.5px] font-medium uppercase tracking-[0.22em] text-text-muted sm:inline-block">
                Cloud Automation
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden items-center gap-7 sm:flex">
            {navLinks.map(({ href, label }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`group relative font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                    active ? "text-text" : "text-text-muted hover:text-text"
                  }`}
                >
                  {label}
                  {/* Underline slide-in on hover */}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 left-0 h-px origin-left bg-accent transition-transform duration-200 ${
                      active
                        ? "right-0 scale-x-100"
                        : "right-0 scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          <ThemeToggle />
        </div>

        {/* Scroll progress — overlays the bottom border as page scrolls.
            Uses a MotionValue so this NEVER triggers a React re-render. */}
        <motion.div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-px origin-left bg-accent"
          style={{ scaleX: scrollYProgress }}
        />
      </div>
    </nav>
  );
}
