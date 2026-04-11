"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { usePathname } from "next/navigation";
import { motion, useScroll } from "framer-motion";

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
            className="flex items-center gap-2.5 text-text transition-opacity hover:opacity-80"
            aria-label="Sandbox home"
          >
            <span
              aria-hidden="true"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-accent/40 bg-accent/10 font-mono text-[10px] font-bold text-accent"
            >
              SB
            </span>
            <span className="font-display text-sm font-semibold tracking-wide text-text">
              Sandbox
            </span>
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
                  className={`group relative font-mono text-xs uppercase tracking-[0.12em] transition-colors ${
                    active ? "text-accent" : "text-text-muted hover:text-text"
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
