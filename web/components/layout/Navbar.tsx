"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UserMenu } from "./UserMenu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Templates" },
  { href: "/builder", label: "Builder" },
  { href: "/my-stuff", label: "My Stuff" },
];

export interface NavbarProps {
  user?: { upn: string; displayName: string } | null;
}

export function Navbar({ user }: NavbarProps = {}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname === "/login") return null;

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-200 ${
        scrolled
          ? "bg-surface/80 backdrop-blur-md border-b border-border/50"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="Sandbox home"
        >
          <span className="font-mono text-base font-medium text-text">
            <span className="text-prompt">~/</span>sandbox
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative rounded-lg px-3 py-2 text-[15px] font-medium tracking-tight transition-colors duration-150 ${
                  active
                    ? "text-text"
                    : "text-text-muted hover:text-text"
                }`}
              >
                {label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    aria-hidden="true"
                    className="absolute -bottom-0.5 left-2 right-2 h-0.5 rounded-full bg-accent"
                    style={{
                      boxShadow: "0 0 6px rgba(11,189,232,0.35)",
                    }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold select-none"
            >
              SB
            </div>
          )}
          <button
            className="sm:hidden flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-text-muted hover:text-text hover:bg-surface-elevated"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="sm:hidden overflow-hidden border-t border-border bg-surface"
          >
            <div className="flex flex-col gap-1 px-6 py-4">
              {navLinks.map(({ href, label }) => {
                const active =
                  href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "text-text bg-surface-elevated"
                        : "text-text-muted hover:text-text"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
