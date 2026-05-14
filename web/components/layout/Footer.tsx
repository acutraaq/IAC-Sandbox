"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <footer className="border-t border-border bg-surface/50">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-6 md:px-8">
        <p className="font-mono text-xs text-text-faint">
          <span className="text-comment"># </span>
          v1.0.0 · sub-epf-sandbox-internal · southeastasia
        </p>
      </div>
    </footer>
  );
}
