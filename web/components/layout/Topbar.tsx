"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Bell, ChevronRight } from "lucide-react";

export function Topbar() {
  const pathname = usePathname();

  // Basic breadcrumb generation
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumb = paths.length === 0 
    ? "Home" 
    : paths[0].charAt(0).toUpperCase() + paths[0].slice(1);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-bg/90 px-8 backdrop-blur-md">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-text-muted">
        <span>Sandbox IAC</span>
        <ChevronRight size={14} className="opacity-50" />
        <span className="font-semibold text-text">{breadcrumb}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <button 
          aria-label="Notifications"
          title="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-elevated hover:text-text"
        >
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
