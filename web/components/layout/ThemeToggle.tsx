"use client";

import { useState, useEffect, startTransition } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "sandbox-theme";

export function ThemeToggle() {
  // Always initialize to "dark" to match the server-rendered HTML, then sync
  // from localStorage after hydration. Using getInitialTheme as a lazy
  // initializer causes a hydration mismatch when localStorage holds "light".
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      startTransition(() => setTheme(stored));
    }
  }, []);

  // Sync DOM attribute whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="rounded-full p-2 transition-colors hover:bg-surface-elevated"
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-text-muted" />
      ) : (
        <Moon className="h-5 w-5 text-text-muted" />
      )}
    </button>
  );
}
