"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus, List, Settings, Blocks } from "lucide-react";

const MAIN_LINKS = [
  { href: "/", label: "Home", icon: LayoutGrid },
  { href: "/builder", label: "Create something", icon: Plus },
  { href: "/templates", label: "My stuff", icon: List },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-surface text-text transition-colors duration-200">
      {/* Brand / Logo */}
      <div className="flex h-16 shrink-0 items-center px-6">
        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-accent text-white">
            <Blocks size={14} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Sandbox IAC</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-4 py-4 scrollbar-hide">
        <p className="mb-2 px-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-text-muted opacity-70">
          Main
        </p>
        <ul className="flex flex-col gap-1">
          {MAIN_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-bg text-text"
                      : "text-text-muted hover:bg-bg/50 hover:text-text"
                  }`}
                >
                  <Icon size={16} className={isActive ? "text-text" : "text-text-muted group-hover:text-text"} />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex shrink-0 flex-col gap-1 border-t border-border p-4">
        <button className="group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-bg/50 hover:text-text">
          <Settings size={16} className="text-text-muted group-hover:text-text" />
          Settings
        </button>

        {/* User Profile */}
        <div className="mt-2 flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#4CAF50] text-xs font-bold text-white">
            MO
          </div>
          <div className="flex flex-col text-left">
            <span className="text-sm font-bold leading-none text-text">Maya Okafor</span>
            <span className="mt-1 text-xs leading-none text-text-muted">Marketing · Contoso</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
