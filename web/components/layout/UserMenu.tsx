"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api";

export interface UserMenuProps {
  user: { upn: string; displayName: string };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    await logoutUser();
    router.replace("/login");
  }

  function handleMenuKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const items = ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]');
      if (!items?.length) return;
      const idx = Array.from(items).indexOf(document.activeElement as HTMLElement);
      const next = e.key === "ArrowDown"
        ? (idx + 1) % items.length
        : (idx - 1 + items.length) % items.length;
      items[next].focus();
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold select-none"
      >
        {initials(user.displayName)}
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Account options"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-surface-elevated p-2 shadow-lg"
        >
          <div className="px-2 py-2" role="presentation">
            <p className="text-sm font-medium text-text">{user.displayName}</p>
            <p className="text-xs text-text-muted">{user.upn}</p>
          </div>
          <div className="my-1 border-t border-border" role="separator" />
          <button
            role="menuitem"
            onClick={signOut}
            className="w-full rounded px-2 py-2 text-left text-sm text-text hover:bg-surface focus:bg-surface focus:outline-none"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
