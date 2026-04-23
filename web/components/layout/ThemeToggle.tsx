"use client";

import { useState, useEffect, startTransition } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "sandbox-theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark") {
      startTransition(() => setTheme("dark"));
    }
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
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
