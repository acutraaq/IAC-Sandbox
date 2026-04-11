"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "sandbox-theme";

function getInitialTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">(getInitialTheme);

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
