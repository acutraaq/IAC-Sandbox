"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { Box } from "lucide-react";

export function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold text-text"
        >
          <Box className="h-6 w-6 text-accent" />
          <span>Sandbox</span>
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          <Link
            href="/templates"
            className="text-sm text-text-muted transition-colors hover:text-text"
          >
            Templates
          </Link>
          <Link
            href="/builder"
            className="text-sm text-text-muted transition-colors hover:text-text"
          >
            Builder
          </Link>
        </div>

        <ThemeToggle />
      </div>
    </nav>
  );
}
