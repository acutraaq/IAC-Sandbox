"use client";

import Link from "next/link";

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Templates" },
  { href: "/builder", label: "Builder" },
  { href: "/my-stuff", label: "My Stuff" },
];

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-bg-deep">
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {/* Left — version meta */}
          <div className="space-y-3">
            <span className="font-mono text-sm font-medium text-text">
              <span className="text-prompt">~/</span>sandbox
            </span>
            <p className="font-mono text-xs text-text-faint">
              v1.0.0 · sub-epf-sandbox-internal · southeastasia
            </p>
          </div>

          {/* Center — nav links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:justify-center">
            {footerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-text-muted transition-colors hover:text-text"
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right — legal */}
          <div className="flex items-center gap-4 sm:justify-end">
            <Link
              href="/privacy"
              className="text-sm text-text-muted transition-colors hover:text-text"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="mt-10 border-t border-border/20 pt-6">
          <p className="text-center font-mono text-xs text-text-faint/60">
            <span className="text-comment/60" aria-hidden="true"># </span>
            All systems local &middot; Built for EPF teams
          </p>
        </div>
      </div>
    </footer>
  );
}
