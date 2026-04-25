"use client";

import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex h-12 max-w-7xl items-center justify-center px-6 md:px-8">
        <p className="text-xs text-text-muted">
          Sandbox Cloud Automation&nbsp;&nbsp;·&nbsp;&nbsp;v1.0.0&nbsp;&nbsp;·&nbsp;&nbsp;Sandbox
          Environment
        </p>
      </div>
    </footer>
  );
}
