# UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully redesign the IAC Sandbox web app with IBM Plex fonts, soft blue-gray light-first palette, unified top navbar, skeleton loading, status timeline, policy tooltips, and 4 new bundle templates.

**Architecture:** Replace the fixed sidebar layout (PageShell + Sidebar + Topbar) with a single top Navbar + Footer. Light mode becomes the CSS default (`:root`), dark via `[data-theme="dark"]`. New components are built before old ones are deleted. Pages are rewritten in-place.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS v4 custom tokens, IBM Plex Sans/Mono (next/font/google), Vitest + React Testing Library, Lucide icons.

---

## File Map

| Action | File |
|--------|------|
| Modify | `web/app/globals.css` |
| Modify | `web/components/layout/ThemeToggle.tsx` |
| Modify | `web/app/layout.tsx` |
| Create | `web/components/ui/Logo.tsx` |
| Create | `web/components/ui/Logo.test.tsx` |
| Create | `web/components/layout/Navbar.tsx` |
| Create | `web/__tests__/components/layout/Navbar.test.tsx` |
| Create | `web/components/layout/Breadcrumb.tsx` |
| Create | `web/__tests__/components/layout/Breadcrumb.test.tsx` |
| Create | `web/components/layout/Footer.tsx` |
| Create | `web/__tests__/components/layout/Footer.test.tsx` |
| Create | `web/components/layout/PageTransition.tsx` |
| Delete | `web/components/layout/Sidebar.tsx` |
| Delete | `web/components/layout/Nav.tsx` |
| Delete | `web/components/layout/Topbar.tsx` |
| Delete | `web/components/layout/PageShell.tsx` |
| Delete | `web/app/login/page.tsx` |
| Delete | `web/components/home/HeroSection.tsx` |
| Delete | `web/components/home/FeaturesSection.tsx` |
| Delete | `web/components/home/GetStartedSection.tsx` |
| Delete | `web/components/home/DashboardHeader.tsx` |
| Modify | `web/app/page.tsx` |
| Modify | `web/components/home/TemplateGrid.tsx` |
| Modify | `web/components/home/DeployedList.tsx` |
| Modify | `web/lib/icons.ts` |
| Modify | `web/data/templates.json` |
| Modify | `web/app/templates/page.tsx` |
| Modify | `web/app/templates/[slug]/page.tsx` |
| Modify | `web/app/my-stuff/page.tsx` |
| Modify | `web/__tests__/app/my-stuff/page.test.tsx` |
| Modify | `web/components/review/ConfirmModal.tsx` |
| Modify | `web/components/review/ConfirmModal.test.tsx` |
| Modify | `web/app/review/page.tsx` |
| Modify | `web/app/builder/page.tsx` |
| Modify | `web/components/builder/ResourceCatalog.tsx` |

---

## Task 1: CSS design tokens + light-first theme

**Files:**
- Modify: `web/app/globals.css`

- [ ] **Step 1: Replace globals.css**

Write `web/app/globals.css` in full:

```css
@import "tailwindcss";

/* ── Light theme (default) ── */
:root {
  --color-bg: #edf1f7;
  --color-surface: #f8fafd;
  --color-surface-elevated: #ffffff;
  --color-border: #d4dce8;
  --color-border-strong: #b0c0d8;
  --color-text: #1e3148;
  --color-text-muted: #5a7290;
  --color-primary: #1e3a5f;
  --color-primary-hover: #163050;
  --color-accent: #2b7fd4;
  --color-accent-hover: #3a8ee3;
  --color-error: #c0392b;
  --color-success: #2e7d52;
  --color-warning: #9a6110;
}

/* ── Dark theme ── */
html[data-theme="dark"] {
  --color-bg: #1a2535;
  --color-surface: #243044;
  --color-surface-elevated: #2e3d58;
  --color-border: rgba(44, 127, 212, 0.18);
  --color-border-strong: rgba(44, 127, 212, 0.35);
  --color-text: #d8e4f0;
  --color-text-muted: rgba(160, 190, 225, 0.75);
  --color-primary: #2b7fd4;
  --color-primary-hover: #3a8ee3;
  --color-accent: #4a9be0;
  --color-accent-hover: #5aaef0;
  --color-error: #ef4444;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
}

/* ── Tailwind v4 theme tokens ── */
@theme inline {
  --color-bg: var(--color-bg);
  --color-surface: var(--color-surface);
  --color-surface-elevated: var(--color-surface-elevated);
  --color-border: var(--color-border);
  --color-border-strong: var(--color-border-strong);
  --color-text: var(--color-text);
  --color-text-muted: var(--color-text-muted);
  --color-primary: var(--color-primary);
  --color-primary-hover: var(--color-primary-hover);
  --color-accent: var(--color-accent);
  --color-accent-hover: var(--color-accent-hover);
  --color-error: var(--color-error);
  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --font-sans: var(--font-sans), system-ui, sans-serif;
  --font-mono: var(--font-mono), monospace;
}

/* ── Base styles ── */
body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  background-image:
    linear-gradient(rgba(44, 127, 212, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(44, 127, 212, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  background-attachment: fixed;
}

/* ── Animation keyframes ── */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes cursor-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

/* ── Animation utilities ── */
@utility animate-fade-in {
  animation: fade-in 150ms ease-out both;
}

@utility animate-cursor-blink {
  animation: cursor-blink 1s step-end infinite;
}

/* ── Reduced motion ── */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ── Focus visible ring ── */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

/* ── Scrollbar styling ── */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--color-border-strong);
  border-radius: 3px;
}
```

- [ ] **Step 2: Commit**

```bash
git add web/app/globals.css
git commit -m "style: soft blue-gray token set, light-first theme, --color-primary, fade-in keyframe"
```

---

## Task 2: ThemeToggle — default to light

**Files:**
- Modify: `web/components/layout/ThemeToggle.tsx`

- [ ] **Step 1: Replace ThemeToggle**

Write `web/components/layout/ThemeToggle.tsx` in full:

```tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add web/components/layout/ThemeToggle.tsx
git commit -m "feat: default theme to light; toggle manages data-theme=dark attribute"
```

---

## Task 3: Logo component

**Files:**
- Create: `web/components/ui/Logo.tsx`
- Create: `web/components/ui/Logo.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/components/ui/Logo.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders SVG with aria-hidden", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
  });

  it("renders 9 dot circles", () => {
    const { container } = render(<Logo />);
    const circles = container.querySelectorAll("circle");
    expect(circles).toHaveLength(9);
  });

  it("renders sm size as 20x20", () => {
    const { container } = render(<Logo size="sm" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("20");
    expect(svg?.getAttribute("height")).toBe("20");
  });

  it("renders lg size as 48x48", () => {
    const { container } = render(<Logo size="lg" />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("48");
    expect(svg?.getAttribute("height")).toBe("48");
  });

  it("renders md size as 32x32 by default", () => {
    const { container } = render(<Logo />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("width")).toBe("32");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npm run test -- "Logo.test" --run
```
Expected: FAIL — `Logo` not found

- [ ] **Step 3: Implement Logo**

Create `web/components/ui/Logo.tsx`:

```tsx
interface LogoProps {
  size?: "sm" | "md" | "lg";
}

const configs = {
  sm: { dim: 20, padding: 5,  dotR: 1.5, strokeW: 1   },
  md: { dim: 32, padding: 8,  dotR: 2,   strokeW: 1.5 },
  lg: { dim: 48, padding: 12, dotR: 3,   strokeW: 2   },
};

export function Logo({ size = "md" }: LogoProps) {
  const { dim, padding, dotR, strokeW } = configs[size];
  const step = (dim - 2 * padding) / 2;

  const dots: { cx: number; cy: number }[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      dots.push({ cx: padding + col * step, cy: padding + row * step });
    }
  }

  return (
    <svg
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      fill="none"
      aria-hidden="true"
    >
      <rect
        x={strokeW / 2}
        y={strokeW / 2}
        width={dim - strokeW}
        height={dim - strokeW}
        rx={4}
        stroke="var(--color-accent)"
        strokeWidth={strokeW}
      />
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={dotR} fill="var(--color-accent)" />
      ))}
    </svg>
  );
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd web && npm run test -- "Logo.test" --run
```
Expected: 5 PASS

- [ ] **Step 5: Commit**

```bash
git add web/components/ui/Logo.tsx web/components/ui/Logo.test.tsx
git commit -m "feat: add Logo SVG component — 3x3 dot grid in rounded square, 3 sizes"
```

---

## Task 4: Navbar component

**Files:**
- Create: `web/components/layout/Navbar.tsx`
- Create: `web/__tests__/components/layout/Navbar.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/__tests__/components/layout/Navbar.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/layout/Navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Navbar", () => {
  it("renders the Sandbox wordmark", () => {
    render(<Navbar />);
    expect(screen.getByText("Sandbox")).toBeInTheDocument();
  });

  it("renders Home and Templates nav links", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
  });

  it("marks Home as aria-current=page when on /", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("renders the SB user avatar", () => {
    render(<Navbar />);
    expect(screen.getByText("SB")).toBeInTheDocument();
  });

  it("renders theme toggle button", () => {
    render(<Navbar />);
    expect(
      screen.getByRole("button", { name: /switch to/i })
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npm run test -- "Navbar.test" --run
```
Expected: FAIL — `Navbar` not found

- [ ] **Step 3: Implement Navbar**

Create `web/components/layout/Navbar.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Templates" },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 4);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      aria-label="Main navigation"
      className={`fixed top-0 left-0 right-0 z-50 border-b border-border transition-colors duration-200 ${
        scrolled ? "backdrop-blur-md bg-surface/90" : "bg-surface"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
        {/* Logo + wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="Sandbox home"
        >
          <Logo size="md" />
          <span className="text-base font-semibold text-text">Sandbox</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden sm:flex items-center gap-8">
          {navLinks.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative text-sm font-medium transition-colors ${
                  active ? "text-text" : "text-text-muted hover:text-text"
                }`}
              >
                {label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right: toggle + avatar + mobile button */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold select-none"
          >
            SB
          </div>
          <button
            className="sm:hidden rounded-md p-1 text-text-muted hover:text-text"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-surface px-6 py-4 flex flex-col gap-4">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="text-sm font-medium text-text"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd web && npm run test -- "Navbar.test" --run
```
Expected: 5 PASS

- [ ] **Step 5: Commit**

```bash
git add web/components/layout/Navbar.tsx web/__tests__/components/layout/Navbar.test.tsx
git commit -m "feat: add Navbar — logo, Home/Templates links, theme toggle, avatar, mobile menu"
```

---

## Task 5: Breadcrumb, Footer, PageTransition

**Files:**
- Create: `web/components/layout/Breadcrumb.tsx`
- Create: `web/__tests__/components/layout/Breadcrumb.test.tsx`
- Create: `web/components/layout/Footer.tsx`
- Create: `web/__tests__/components/layout/Footer.test.tsx`
- Create: `web/components/layout/PageTransition.tsx`

- [ ] **Step 1: Write failing tests**

Create `web/__tests__/components/layout/Breadcrumb.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Breadcrumb", () => {
  it("renders all item labels", () => {
    render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Templates" }]}
      />
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Templates")).toBeInTheDocument();
  });

  it("renders a link for non-last items", () => {
    render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Templates" }]}
      />
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/"
    );
  });

  it("does not render a link for the last item", () => {
    render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Templates" }]}
      />
    );
    expect(screen.queryByRole("link", { name: "Templates" })).toBeNull();
  });

  it("renders separator between items", () => {
    const { container } = render(
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Templates" }]}
      />
    );
    expect(container.textContent).toContain("/");
  });
});
```

Create `web/__tests__/components/layout/Footer.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/layout/Footer";

describe("Footer", () => {
  it("renders brand name", () => {
    render(<Footer />);
    expect(screen.getByText(/Sandbox Cloud Automation/i)).toBeInTheDocument();
  });

  it("renders environment label", () => {
    render(<Footer />);
    expect(screen.getByText(/Sandbox Environment/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd web && npm run test -- "Breadcrumb.test|Footer.test" --run
```
Expected: FAIL — components not found

- [ ] **Step 3: Implement Breadcrumb**

Create `web/components/layout/Breadcrumb.tsx`:

```tsx
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-2">
              {i > 0 && (
                <span className="text-text-muted" aria-hidden="true">
                  /
                </span>
              )}
              {isLast || !item.href ? (
                <span
                  className={
                    isLast ? "font-medium text-primary" : "text-text-muted"
                  }
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-text-muted transition-colors hover:text-text"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 4: Implement Footer**

Create `web/components/layout/Footer.tsx`:

```tsx
export function Footer() {
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
```

- [ ] **Step 5: Implement PageTransition**

Create `web/components/layout/PageTransition.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface PageTransitionProps {
  children: React.ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div
      className={`transition-[opacity,transform] ease-out motion-reduce:transition-none ${
        visible
          ? "opacity-100 translate-y-0 duration-150"
          : "opacity-0 translate-y-1 duration-0"
      }`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 6: Run tests to confirm pass**

```bash
cd web && npm run test -- "Breadcrumb.test|Footer.test" --run
```
Expected: 6 PASS

- [ ] **Step 7: Commit**

```bash
git add web/components/layout/Breadcrumb.tsx web/components/layout/Footer.tsx web/components/layout/PageTransition.tsx web/__tests__/components/layout/Breadcrumb.test.tsx web/__tests__/components/layout/Footer.test.tsx
git commit -m "feat: add Breadcrumb, Footer, PageTransition layout components"
```

---

## Task 6: Update app/layout.tsx — new shell + IBM Plex fonts

**Files:**
- Modify: `web/app/layout.tsx`

- [ ] **Step 1: Replace layout.tsx**

Write `web/app/layout.tsx` in full. Note: `geist` package is removed — replace its import:

```tsx
import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/ui/Toast";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Sandbox IAC",
  description:
    "Deploy cloud resources in minutes. Pick a template or build your own configuration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-text font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="flex-1 pt-16">
          {children}
        </main>
        <Footer />
        <ToastContainer />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Uninstall geist package**

```bash
cd web && npm uninstall geist
```

- [ ] **Step 3: Run type-check**

```bash
cd web && npm run type-check
```
Expected: 0 errors (old Sidebar/Nav/Topbar/PageShell still exist but are no longer imported — no error)

- [ ] **Step 4: Commit**

```bash
git add web/app/layout.tsx web/package.json web/package-lock.json
git commit -m "feat: switch to IBM Plex Sans/Mono, replace PageShell with Navbar+Footer shell"
```

---

## Task 7: Delete dead layout + home components

**Files to delete:**
- `web/components/layout/Sidebar.tsx`
- `web/components/layout/Nav.tsx`
- `web/components/layout/Topbar.tsx`
- `web/components/layout/PageShell.tsx`
- `web/app/login/page.tsx`
- `web/components/home/HeroSection.tsx`
- `web/components/home/FeaturesSection.tsx`
- `web/components/home/GetStartedSection.tsx`
- `web/components/home/DashboardHeader.tsx`

- [ ] **Step 1: Delete files**

```bash
rm web/components/layout/Sidebar.tsx
rm web/components/layout/Nav.tsx
rm web/components/layout/Topbar.tsx
rm web/components/layout/PageShell.tsx
rm web/app/login/page.tsx
rm web/components/home/HeroSection.tsx
rm web/components/home/FeaturesSection.tsx
rm web/components/home/GetStartedSection.tsx
rm web/components/home/DashboardHeader.tsx
```

- [ ] **Step 2: Verify type-check and tests still pass**

```bash
cd web && npm run type-check && npm run test --run
```
Expected: 0 errors — files were no longer imported

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete Sidebar, Nav, Topbar, PageShell, login page, dead home components"
```

---

## Task 8: Home page redesign

**Files:**
- Modify: `web/app/page.tsx`
- Modify: `web/components/home/TemplateGrid.tsx`
- Modify: `web/components/home/DeployedList.tsx`

- [ ] **Step 1: Rewrite home TemplateGrid to accept templates as props**

Write `web/components/home/TemplateGrid.tsx` in full:

```tsx
import Link from "next/link";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { Template } from "@/types";

interface TemplateGridProps {
  templates: Template[];
}

export function TemplateGrid({ templates }: TemplateGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {templates.map((template) => (
        <Link
          key={template.slug}
          href={`/templates/${template.slug}`}
          className="group flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-all hover:border-accent/30 hover:bg-surface-elevated hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/15">
            <DynamicIcon name={template.icon} className="h-5 w-5 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{template.name}</p>
            <p className="mt-0.5 text-xs text-text-muted line-clamp-2">
              {template.description}
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
            {template.estimatedTime}
          </p>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite DeployedList with skeleton loading**

Write `web/components/home/DeployedList.tsx` in full:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listMyDeployments } from "@/lib/api";
import type { MyDeploymentItem, DeploymentStatus } from "@/types";

function statusDot(status: DeploymentStatus) {
  switch (status) {
    case "succeeded": return "bg-success";
    case "failed":    return "bg-error";
    case "running":   return "bg-accent animate-pulse motion-reduce:animate-none";
    default:          return "bg-warning animate-pulse motion-reduce:animate-none";
  }
}

function statusLabel(status: DeploymentStatus) {
  switch (status) {
    case "succeeded": return "Succeeded";
    case "failed":    return "Failed";
    case "running":   return "Deploying";
    default:          return "Queued";
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function SkeletonRow() {
  return (
    <div
      data-testid="skeleton-row"
      className="h-16 rounded-xl bg-border animate-pulse motion-reduce:animate-none"
    />
  );
}

export function DeployedList() {
  const [items, setItems] = useState<MyDeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyDeployments()
      .then((data) => setItems(data.slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-muted">
        No deployments yet.{" "}
        <Link href="/templates" className="text-accent hover:underline">
          Start with a template.
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface">
        {items.map((item, index) => (
          <div
            key={item.submissionId ?? item.resourceGroup}
            className={`flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface-elevated ${
              index !== items.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                aria-hidden="true"
                className={`h-2 w-2 shrink-0 rounded-full ${statusDot(item.status)}`}
              />
              <span className="sr-only">{statusLabel(item.status)}</span>
              <div className="min-w-0">
                <p className="truncate font-mono text-sm font-medium text-text">
                  {item.resourceGroup}
                </p>
                <p className="text-xs text-text-muted">
                  {item.location}
                  {item.deployedAt && ` · ${formatDate(item.deployedAt)}`}
                </p>
              </div>
            </div>
            <span className="shrink-0 ml-4 text-xs font-medium text-text-muted">
              {statusLabel(item.status)}
            </span>
          </div>
        ))}
      </div>
      <div className="text-right">
        <Link href="/my-stuff" className="text-sm text-accent hover:underline">
          View all →
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Rewrite app/page.tsx**

Write `web/app/page.tsx` in full:

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TemplateGrid } from "@/components/home/TemplateGrid";
import { DeployedList } from "@/components/home/DeployedList";
import { PageTransition } from "@/components/layout/PageTransition";
import templatesData from "@/data/templates.json";
import type { Template } from "@/types";

const popularTemplates = (templatesData as Template[])
  .filter((t) => !t.policyBlocked)
  .slice(0, 4);

export default function Home() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-8 md:px-8 md:py-12">
        {/* Zone 1: Welcome */}
        <div>
          <h1 className="text-4xl font-bold text-text">Sandbox</h1>
          <p className="mt-2 text-text-muted">Deploy Azure resources in minutes.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="md">
              <Link href="/templates">Browse Templates</Link>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href="/builder">Build Custom</Link>
            </Button>
          </div>
        </div>

        {/* Zone 2: Popular Templates */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              Popular Templates
            </h2>
            <Link href="/templates" className="text-sm text-accent hover:underline">
              View all templates →
            </Link>
          </div>
          <TemplateGrid templates={popularTemplates} />
        </div>

        {/* Zone 3: Recent Deployments */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-muted">
            My Recent Deployments
          </h2>
          <DeployedList />
        </div>
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
cd web && npm run test --run
```
Expected: all existing tests pass (no dedicated home component tests to break)

- [ ] **Step 5: Commit**

```bash
git add web/app/page.tsx web/components/home/TemplateGrid.tsx web/components/home/DeployedList.tsx
git commit -m "feat: redesign home page — 3-zone dashboard, real template data, skeleton loading"
```

---

## Task 9: New icon registrations + bundle templates + templates page

**Files:**
- Modify: `web/lib/icons.ts`
- Modify: `web/data/templates.json`
- Modify: `web/app/templates/page.tsx`
- Modify: `web/app/templates/[slug]/page.tsx`

- [ ] **Step 1: Add new icons to the registry**

Write `web/lib/icons.ts` in full:

```typescript
import {
  Globe,
  Monitor,
  Database,
  HardDrive,
  Network,
  KeyRound,
  Box,
  LayoutGrid,
  Shield,
  Cloud,
  Server,
  Lock,
  Cpu,
  Folder,
  Layers,
  GitMerge,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Globe,
  Monitor,
  Database,
  HardDrive,
  Network,
  KeyRound,
  Box,
  LayoutGrid,
  Shield,
  Cloud,
  Server,
  Lock,
  Cpu,
  Folder,
  Layers,
  GitMerge,
  ShieldCheck,
};

export function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Cloud;
}
```

- [ ] **Step 2: Append 4 bundle templates to data/templates.json**

Open `web/data/templates.json`. It currently has 8 templates in an array. Append these 4 objects before the closing `]`:

```json
,
{
  "slug": "full-stack-web-app",
  "name": "Full-Stack Web App",
  "description": "App Service + Azure SQL + Storage + Key Vault — a complete production-ready web stack.",
  "category": "compute",
  "icon": "Layers",
  "resourceCount": 6,
  "estimatedTime": "~8 minutes",
  "policyBlocked": false,
  "steps": [
    {
      "title": "App Details",
      "description": "Name your application and choose its compute tier.",
      "fields": [
        {
          "name": "appName",
          "label": "Application name",
          "type": "text",
          "required": true,
          "placeholder": "my-fullstack-app",
          "helpText": "Used as the base name for all resources in this stack."
        },
        {
          "name": "planSize",
          "label": "App Service tier",
          "type": "select",
          "required": true,
          "helpText": "Choose the compute size for your web application.",
          "options": [
            { "label": "Small (B1) — Testing and demos", "value": "B1" },
            { "label": "Medium (B2) — Most teams", "value": "B2" },
            { "label": "Standard (S1) — Production workloads", "value": "S1" }
          ]
        },
        {
          "name": "region",
          "label": "Region",
          "type": "select",
          "required": true,
          "options": [
            { "label": "Southeast Asia (Singapore)", "value": "southeastasia" },
            { "label": "East Asia (Hong Kong)", "value": "eastasia" },
            { "label": "Australia East (Sydney)", "value": "australiaeast" }
          ]
        }
      ]
    },
    {
      "title": "Database Settings",
      "description": "Configure your Azure SQL database.",
      "fields": [
        {
          "name": "sqlAdminUser",
          "label": "SQL admin username",
          "type": "text",
          "required": true,
          "placeholder": "sqladmin"
        },
        {
          "name": "sqlAdminPassword",
          "label": "SQL admin password",
          "type": "text",
          "required": true,
          "placeholder": "Enter a strong password"
        },
        {
          "name": "dbSku",
          "label": "Database tier",
          "type": "select",
          "required": true,
          "options": [
            { "label": "Basic (2 GB) — Development", "value": "Basic" },
            { "label": "Standard S2 — Most workloads", "value": "S2" }
          ]
        }
      ]
    },
    {
      "title": "Storage",
      "description": "Configure blob storage for files and assets.",
      "fields": [
        {
          "name": "storageTier",
          "label": "Storage redundancy",
          "type": "select",
          "required": true,
          "options": [
            { "label": "Locally Redundant (LRS) — Cheapest", "value": "Standard_LRS" },
            { "label": "Zone Redundant (ZRS) — Recommended", "value": "Standard_ZRS" }
          ]
        }
      ]
    },
    {
      "title": "Security",
      "description": "Configure Key Vault for secrets management.",
      "fields": [
        {
          "name": "kvSku",
          "label": "Key Vault tier",
          "type": "select",
          "required": true,
          "options": [
            { "label": "Standard", "value": "standard" },
            { "label": "Premium (HSM-backed)", "value": "premium" }
          ]
        }
      ]
    },
    {
      "title": "Review",
      "description": "Review your full-stack web app configuration before deploying.",
      "fields": []
    }
  ]
},
{
  "slug": "microservices-platform",
  "name": "Microservices Platform",
  "description": "Container Apps + Service Bus + Managed Identity — event-driven microservices infrastructure.",
  "category": "compute",
  "icon": "Network",
  "resourceCount": 4,
  "estimatedTime": "~6 minutes",
  "policyBlocked": false,
  "steps": [
    {
      "title": "App Details",
      "description": "Name your platform and configure the container.",
      "fields": [
        {
          "name": "appName",
          "label": "Platform name",
          "type": "text",
          "required": true,
          "placeholder": "my-microservices",
          "helpText": "Used as the base name for all resources."
        },
        {
          "name": "containerImage",
          "label": "Container image",
          "type": "text",
          "required": true,
          "placeholder": "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest",
          "helpText": "Docker image to deploy into the Container App."
        },
        {
          "name": "region",
          "label": "Region",
          "type": "select",
          "required": true,
          "options": [
            { "label": "Southeast Asia (Singapore)", "value": "southeastasia" },
            { "label": "East Asia (Hong Kong)", "value": "eastasia" },
            { "label": "Australia East (Sydney)", "value": "australiaeast" }
          ]
        }
      ]
    },
    {
      "title": "Messaging",
      "description": "Configure the Service Bus namespace for event-driven messaging.",
      "fields": [
        {
          "name": "sbSku",
          "label": "Service Bus tier",
          "type": "select",
          "required": true,
          "options": [
            { "label": "Basic — Simple queues", "value": "Basic" },
            { "label": "Standard — Topics and subscriptions", "value": "Standard" }
          ]
        }
      ]
    },
    {
      "title": "Identity",
      "description": "Configure a Managed Identity for secure service-to-service communication.",
      "fields": [
        {
          "name": "enableManagedIdentity",
          "label": "Enable user-assigned managed identity?",
          "type": "toggle",
          "required": false,
          "helpText": "Recommended. Allows your Container App to access Azure services securely."
        }
      ]
    },
    {
      "title": "Review",
      "description": "Review your microservices platform configuration before deploying.",
      "fields": []
    }
  ]
},
{
  "slug": "data-pipeline",
  "name": "Data Pipeline",
  "description": "Storage Account + Azure Functions + Azure SQL — serverless data ingestion and processing.",
  "category": "data",
  "icon": "GitMerge",
  "resourceCount": 4,
  "estimatedTime": "~6 minutes",
  "policyBlocked": false,
  "steps": [
    {
      "title": "Pipeline Name",
      "description": "Name your data pipeline.",
      "fields": [
        {
          "name": "pipelineName",
          "label": "Pipeline name",
          "type": "text",
          "required": true,
          "placeholder": "my-data-pipeline",
          "helpText": "Used as the base name for all resources."
        },
        {
          "name": "region",
          "label": "Region",
          "type": "select",
          "required": true,
          "options": [
            { "label": "Southeast Asia (Singapore)", "value": "southeastasia" },
            { "label": "East Asia (Hong Kong)", "value": "eastasia" },
            { "label": "Australia East (Sydney)", "value": "australiaeast" }
          ]
        }
      ]
    },
    {
      "title": "Storage",
      "description": "Configure blob storage for raw pipeline data.",
      "fields": [
        {
          "name": "storageTier",
          "label": "Storage redundancy",
          "type": "select",
          "required": true,
          "options": [
            { "label": "Locally Redundant (LRS)", "value": "Standard_LRS" },
            { "label": "Zone Redundant (ZRS)", "value": "Standard_ZRS" }
          ]
        }
      ]
    },
    {
      "title": "Database",
      "description": "Configure the Azure SQL destination database.",
      "fields": [
        {
          "name": "sqlAdminUser",
          "label": "SQL admin username",
          "type": "text",
          "required": true,
          "placeholder": "sqladmin"
        },
        {
          "name": "sqlAdminPassword",
          "label": "SQL admin password",
          "type": "text",
          "required": true,
          "placeholder": "Enter a strong password"
        }
      ]
    },
    {
      "title": "Review",
      "description": "Review your data pipeline configuration before deploying.",
      "fields": []
    }
  ]
},
{
  "slug": "secure-api-backend",
  "name": "Secure API Backend",
  "description": "App Service + Key Vault + API Management + Log Analytics — a secure, observable API platform.",
  "category": "compute",
  "icon": "ShieldCheck",
  "resourceCount": 5,
  "estimatedTime": "~10 minutes",
  "policyBlocked": false,
  "steps": [
    {
      "title": "API Details",
      "description": "Name your API and choose the management tier.",
      "fields": [
        {
          "name": "apiName",
          "label": "API name",
          "type": "text",
          "required": true,
          "placeholder": "my-secure-api",
          "helpText": "Used as the base name for all resources."
        },
        {
          "name": "apimSku",
          "label": "API Management tier",
          "type": "select",
          "required": true,
          "helpText": "Developer tier is suitable for non-production workloads.",
          "options": [
            { "label": "Developer (no SLA) — Testing", "value": "Developer" },
            { "label": "Standard (SLA) — Production", "value": "Standard" }
          ]
        },
        {
          "name": "region",
          "label": "Region",
          "type": "select",
          "required": true,
          "options": [
            { "label": "Southeast Asia (Singapore)", "value": "southeastasia" },
            { "label": "East Asia (Hong Kong)", "value": "eastasia" },
            { "label": "Australia East (Sydney)", "value": "australiaeast" }
          ]
        }
      ]
    },
    {
      "title": "Security",
      "description": "Configure Key Vault for secrets and certificate management.",
      "fields": [
        {
          "name": "kvSku",
          "label": "Key Vault tier",
          "type": "select",
          "required": true,
          "options": [
            { "label": "Standard", "value": "standard" },
            { "label": "Premium (HSM-backed)", "value": "premium" }
          ]
        }
      ]
    },
    {
      "title": "Observability",
      "description": "Configure Log Analytics for monitoring and diagnostics.",
      "fields": [
        {
          "name": "logRetentionDays",
          "label": "Log retention (days)",
          "type": "number",
          "required": true,
          "placeholder": "30",
          "min": 7,
          "max": 90,
          "helpText": "How long to retain logs in the workspace."
        }
      ]
    },
    {
      "title": "Review",
      "description": "Review your secure API backend configuration before deploying.",
      "fields": []
    }
  ]
}
```

- [ ] **Step 3: Rewrite app/templates/page.tsx**

Write `web/app/templates/page.tsx` in full:

```tsx
import templatesData from "@/data/templates.json";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { TemplateGrid } from "@/components/templates/TemplateGrid";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageTransition } from "@/components/layout/PageTransition";
import type { Template } from "@/types";

const BUNDLE_SLUGS = [
  "full-stack-web-app",
  "microservices-platform",
  "data-pipeline",
  "secure-api-backend",
];

const bundles = (templatesData as Template[]).filter((t) =>
  BUNDLE_SLUGS.includes(t.slug)
);
const individual = (templatesData as Template[]).filter(
  (t) => !BUNDLE_SLUGS.includes(t.slug)
);

export default function TemplatesPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Templates" }]}
        />

        {/* Scenario Bundles */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-text">Scenario Bundles</h2>
          <p className="mt-1 text-sm text-text-muted">
            Pre-built multi-resource configurations for common workloads.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {bundles.map((t) => (
              <TemplateCard key={t.slug} template={t} />
            ))}
          </div>
        </section>

        {/* Individual Resources */}
        <section>
          <h2 className="mb-1 text-2xl font-semibold text-text">
            Individual Resources
          </h2>
          <p className="mb-6 text-sm text-text-muted">
            Single-resource deployments for targeted infrastructure needs.
          </p>
          <TemplateGrid templates={individual} />
        </section>
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 4: Add Breadcrumb to template detail page**

Read `web/app/templates/[slug]/page.tsx`. Add this import:
```tsx
import { Breadcrumb } from "@/components/layout/Breadcrumb";
```

Inside the JSX return (after the outermost `<div>` opens), add:
```tsx
<Breadcrumb
  items={[
    { label: "Home", href: "/" },
    { label: "Templates", href: "/templates" },
    { label: template.name },
  ]}
/>
```

Where `template.name` is already available in that component from the loaded template data.

- [ ] **Step 5: Run type-check and tests**

```bash
cd web && npm run type-check && npm run test --run
```
Expected: 0 errors, all tests pass

- [ ] **Step 6: Commit**

```bash
git add web/lib/icons.ts web/data/templates.json web/app/templates/page.tsx web/app/templates/[slug]/page.tsx
git commit -m "feat: add 4 bundle templates, rewrite templates page with Scenario Bundles + Individual Resources"
```

---

## Task 10: My Deployments page

**Files:**
- Modify: `web/app/my-stuff/page.tsx`
- Modify: `web/__tests__/app/my-stuff/page.test.tsx`

- [ ] **Step 1: Write updated tests first**

Write `web/__tests__/app/my-stuff/page.test.tsx` in full:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import MyDeploymentsPage from "@/app/my-stuff/page";
import * as api from "@/lib/api";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/lib/api", () => ({
  listMyDeployments: vi.fn(),
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

const mockList = api.listMyDeployments as ReturnType<typeof vi.fn>;

describe("MyDeploymentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows skeleton cards while loading", () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<MyDeploymentsPage />);
    expect(
      screen.getAllByTestId("skeleton-row").length
    ).toBeGreaterThanOrEqual(1);
  });

  it("renders page title as My Deployments", async () => {
    mockList.mockResolvedValue([]);
    render(<MyDeploymentsPage />);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: /my deployments/i })
      ).toBeInTheDocument()
    );
  });

  it("renders a list of resource groups", async () => {
    mockList.mockResolvedValue([
      {
        resourceGroup: "my-app-rg",
        location: "southeastasia",
        tags: {
          "Cost Center": "CC-001",
          "Project ID": "PROJ-001",
          "Project Owner": "Alice",
          "Expiry Date": "2027-01-01",
        },
        status: "succeeded",
        submissionId: "sub-abc",
        deployedAt: "2026-04-20T10:00:00.000Z",
      },
    ]);

    render(<MyDeploymentsPage />);

    await waitFor(() =>
      expect(screen.getByText("my-app-rg")).toBeInTheDocument()
    );
    expect(screen.getByText(/succeeded/i)).toBeInTheDocument();
  });

  it("shows empty state when no deployments found", async () => {
    mockList.mockResolvedValue([]);

    render(<MyDeploymentsPage />);

    await waitFor(() =>
      expect(screen.getByText(/no deployments/i)).toBeInTheDocument()
    );
  });

  it("shows error message when API call fails", async () => {
    mockList.mockRejectedValue(new Error("Network error"));

    render(<MyDeploymentsPage />);

    await waitFor(() =>
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npm run test -- "my-stuff/page.test" --run
```
Expected: FAIL — `skeleton-row` testid not found, heading says "My Stuff" not "My Deployments"

- [ ] **Step 3: Rewrite app/my-stuff/page.tsx**

Write `web/app/my-stuff/page.tsx` in full:

```tsx
"use client";

import { useEffect, useState } from "react";
import { listMyDeployments, ApiError } from "@/lib/api";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageTransition } from "@/components/layout/PageTransition";
import { Package } from "lucide-react";
import type { MyDeploymentItem } from "@/types";

function statusLabel(status: MyDeploymentItem["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: MyDeploymentItem["status"]): string {
  switch (status) {
    case "succeeded": return "text-success";
    case "failed":    return "text-error";
    case "running":   return "text-accent";
    default:          return "text-warning";
  }
}

function SkeletonCard() {
  return (
    <div
      data-testid="skeleton-row"
      className="h-20 rounded-xl bg-border animate-pulse motion-reduce:animate-none"
    />
  );
}

export default function MyDeploymentsPage() {
  const [items, setItems] = useState<MyDeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyDeployments()
      .then(setItems)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load deployments"
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-8 md:py-12">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "My Deployments" }]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text">My Deployments</h1>
          <p className="mt-1 text-text-muted">
            Resource groups you have deployed through this portal.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            Failed to load: {error}
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-text-muted">
            <Package className="h-10 w-10 opacity-40" />
            <p className="text-sm">No deployments found.</p>
            <p className="text-xs opacity-70">
              Deployments you submit will appear here.
            </p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li
                key={item.resourceGroup}
                className="rounded-xl border border-border bg-surface p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-text">
                      {item.resourceGroup}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {item.location}
                      {item.deployedAt && (
                        <>
                          {" · "}
                          {new Date(item.deployedAt).toLocaleDateString(
                            "en-MY",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium ${statusClass(item.status)}`}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                  {(
                    [
                      "Cost Center",
                      "Project ID",
                      "Project Owner",
                      "Expiry Date",
                    ] as const
                  ).map((tag) =>
                    item.tags[tag] ? (
                      <span key={tag} className="text-xs text-text-muted">
                        <span className="font-medium text-text">{tag}:</span>{" "}
                        {item.tags[tag]}
                      </span>
                    ) : null
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd web && npm run test -- "my-stuff/page.test" --run
```
Expected: 5 PASS

- [ ] **Step 5: Commit**

```bash
git add web/app/my-stuff/page.tsx web/__tests__/app/my-stuff/page.test.tsx
git commit -m "feat: redesign My Deployments page — semantic tokens, skeleton loading, Breadcrumb"
```

---

## Task 11: ConfirmModal status timeline

**Files:**
- Modify: `web/components/review/ConfirmModal.tsx`
- Modify: `web/components/review/ConfirmModal.test.tsx`

- [ ] **Step 1: Write updated tests**

Write `web/components/review/ConfirmModal.test.tsx` in full. Preserves all existing valid tests; replaces the 3 status banner tests with timeline tests:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmModal } from "./ConfirmModal";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockProofText = `SANDBOX DEPLOYMENT PROOF
========================
Submission ID : SUB-TEST-123
Status        : accepted`;

const defaultProps = {
  proofText: mockProofText,
  deploymentStatus: null as null,
  deploymentError: null,
  onClose: () => {},
  onReset: () => {},
};

describe("ConfirmModal", () => {
  it("renders nothing when closed", () => {
    render(<ConfirmModal open={false} {...defaultProps} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("displays proof text when open", () => {
    render(<ConfirmModal open={true} {...defaultProps} />);
    expect(screen.getByText(/SUB-TEST-123/)).toBeInTheDocument();
    expect(screen.getByText(/SANDBOX DEPLOYMENT PROOF/)).toBeInTheDocument();
  });

  it("shows Copy to Clipboard button", () => {
    render(<ConfirmModal open={true} {...defaultProps} />);
    expect(
      screen.getByRole("button", { name: /Copy to Clipboard/i })
    ).toBeInTheDocument();
  });

  it("shows Start New Deployment link", () => {
    render(<ConfirmModal open={true} {...defaultProps} />);
    expect(screen.getByText(/Start New Deployment/i)).toBeInTheDocument();
  });

  it("calls onReset when Start New Deployment is clicked", async () => {
    const onReset = vi.fn();
    render(<ConfirmModal open={true} {...defaultProps} onReset={onReset} />);
    await userEvent.click(screen.getByText(/Start New Deployment/i));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(<ConfirmModal open={true} {...defaultProps} onClose={onClose} />);
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows Queued step active for accepted status", () => {
    render(
      <ConfirmModal open={true} {...defaultProps} deploymentStatus="accepted" />
    );
    const queuedLi = screen.getByText("Queued").closest("li");
    expect(queuedLi).toHaveAttribute("data-active");
  });

  it("shows Deploying step active for running status", () => {
    render(
      <ConfirmModal open={true} {...defaultProps} deploymentStatus="running" />
    );
    const deployingLi = screen.getByText("Deploying").closest("li");
    expect(deployingLi).toHaveAttribute("data-active");
  });

  it("shows Complete step active for succeeded status", () => {
    render(
      <ConfirmModal
        open={true}
        {...defaultProps}
        deploymentStatus="succeeded"
      />
    );
    const completeLi = screen.getByText("Complete").closest("li");
    expect(completeLi).toHaveAttribute("data-active");
  });

  it("shows Complete step in error state with error message for failed status", () => {
    render(
      <ConfirmModal
        open={true}
        {...defaultProps}
        deploymentStatus="failed"
        deploymentError="ResourceGroupNotFound: The resource group was not found."
      />
    );
    const completeLi = screen.getByText("Complete").closest("li");
    expect(completeLi).toHaveAttribute("data-failed");
    expect(
      screen.getByText(/ResourceGroupNotFound/i)
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd web && npm run test -- "ConfirmModal.test" --run
```
Expected: FAIL — data-active/data-failed attributes not found; "Deploying to Azure" tests fail

- [ ] **Step 3: Rewrite ConfirmModal.tsx**

Write `web/components/review/ConfirmModal.tsx` in full:

```tsx
"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Check, Copy, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { DeploymentStatus } from "@/types";

interface ConfirmModalProps {
  open: boolean;
  proofText: string;
  deploymentStatus: DeploymentStatus | null;
  deploymentError: string | null;
  onClose: () => void;
  onReset: () => void;
}

const TIMELINE_STEPS = ["Queued", "Provisioning", "Deploying", "Complete"];

function activeStepIndex(status: DeploymentStatus | null): number {
  switch (status) {
    case "accepted":  return 0;
    case "running":   return 2;
    case "succeeded":
    case "failed":    return 3;
    default:          return 0;
  }
}

type StepState = "done" | "active" | "pending" | "failed";

interface TimelineStepProps {
  label: string;
  state: StepState;
  isLast: boolean;
}

function TimelineStep({ label, state, isLast }: TimelineStepProps) {
  const dotClass =
    state === "failed"
      ? "bg-error"
      : state === "done" || state === "active"
      ? "bg-primary"
      : "border-2 border-border bg-surface";

  const labelClass =
    state === "failed"
      ? "text-error font-medium"
      : state === "active"
      ? "text-text font-medium"
      : state === "done"
      ? "text-text"
      : "text-text-muted";

  return (
    <li
      data-active={state === "active" ? "" : undefined}
      data-failed={state === "failed" ? "" : undefined}
      className="flex flex-col items-start gap-1.5"
      style={{ flex: isLast ? "0 0 auto" : 1 }}
    >
      <div className="flex w-full items-center">
        <span
          aria-hidden="true"
          className={`flex h-3 w-3 shrink-0 rounded-full transition-colors ${dotClass} ${
            state === "active"
              ? "animate-pulse motion-reduce:animate-none"
              : ""
          }`}
        />
        {!isLast && (
          <span
            aria-hidden="true"
            className={`h-px flex-1 transition-colors ${
              state === "done" ? "bg-primary" : "bg-border"
            }`}
          />
        )}
      </div>
      <span className={`text-xs ${labelClass}`}>{label}</span>
    </li>
  );
}

function StatusTimeline({
  status,
  error,
}: {
  status: DeploymentStatus | null;
  error: string | null;
}) {
  const activeIdx = activeStepIndex(status);

  return (
    <div className="space-y-2">
      <ol className="flex w-full items-start">
        {TIMELINE_STEPS.map((label, i) => {
          let state: StepState;
          if (status === "failed" && i === 3) {
            state = "failed";
          } else if (i < activeIdx) {
            state = "done";
          } else if (i === activeIdx) {
            state = "active";
          } else {
            state = "pending";
          }
          return (
            <TimelineStep
              key={label}
              label={label}
              state={state}
              isLast={i === TIMELINE_STEPS.length - 1}
            />
          );
        })}
      </ol>
      {status === "failed" && error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}

export function ConfirmModal({
  open,
  proofText,
  deploymentStatus,
  deploymentError,
  onClose,
  onReset,
}: ConfirmModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(proofText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.getElementById("proof-text");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Deployment Submitted">
      <div className="space-y-4">
        <p className="text-sm text-text-muted">
          Your deployment has been submitted. Copy the text below and share it
          with your approver for HOD sign-off.
        </p>

        {deploymentStatus && (
          <StatusTimeline status={deploymentStatus} error={deploymentError} />
        )}

        <div className="relative">
          <pre
            id="proof-text"
            className="max-h-64 overflow-auto rounded-lg border border-border bg-bg p-4 font-mono text-xs leading-relaxed text-text"
          >
            {proofText}
          </pre>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleCopy}
            variant={copied ? "secondary" : "primary"}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>

          <Button asChild variant="ghost" className="w-full" onClick={onReset}>
            <Link href="/">
              <RotateCcw className="h-4 w-4" />
              Start New Deployment
            </Link>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
cd web && npm run test -- "ConfirmModal.test" --run
```
Expected: 10 PASS

- [ ] **Step 5: Commit**

```bash
git add web/components/review/ConfirmModal.tsx web/components/review/ConfirmModal.test.tsx
git commit -m "feat: replace ConfirmModal status banner with 4-step visual timeline"
```

---

## Task 12: Review page polish

**Files:**
- Modify: `web/app/review/page.tsx`

- [ ] **Step 1: Add imports to review/page.tsx**

Add to the imports at the top of `web/app/review/page.tsx`:

```typescript
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageTransition } from "@/components/layout/PageTransition";
```

- [ ] **Step 2: Wrap return in PageTransition and add Breadcrumb**

The current return starts with `<div className="mx-auto max-w-2xl px-6 py-12">`.

Replace the entire return statement with the following. The only changes are:
1. Outer `<PageTransition>` wrapper
2. `py-12` → `py-8 md:py-12`
3. Add `<Breadcrumb>` as first child
4. Label `text-xs` → `text-sm`, `mb-1` → `mb-1.5` for better readability
5. Input `py-2` → `h-11` (touch-friendly height)

```tsx
  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl px-6 py-8 md:px-8 md:py-12">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Review" }]}
        />

        <div className="mb-8">
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
          >
            <ArrowLeft className="h-4 w-4" />
            {mode === "template" ? "Back to setup" : "Back to builder"}
          </Link>
          <h1 className="text-3xl font-bold text-text">Review Your Setup</h1>
          <p className="mt-1 text-text-muted">
            Check everything looks right before submitting.
          </p>
        </div>

        <ReviewSection
          mode={mode}
          selectedTemplate={selectedTemplate}
          wizardState={wizardState}
          selectedResources={selectedResources}
        />

        <div className="mt-6 rounded-xl border border-border bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold text-text">
              Resource Group Tags
            </p>
          </div>
          <p className="mb-4 text-xs text-text-muted">
            Required by subscription policy. All four tags must be provided.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["Cost Center", "Project ID", "Project Owner"] as const).map(
              (field) => (
                <div key={field}>
                  <label className="mb-1.5 block text-sm font-medium text-text">
                    {field} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={tags[field]}
                    onChange={(e) => {
                      setTags((prev) => ({
                        ...prev,
                        [field]: e.target.value,
                      }));
                      if (tagErrors[field])
                        setTagErrors((prev) => ({
                          ...prev,
                          [field]: undefined,
                        }));
                    }}
                    className="w-full h-11 rounded-lg border border-border bg-bg px-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder={field}
                  />
                  {tagErrors[field] && (
                    <p className="mt-1 text-xs text-error">
                      {tagErrors[field]}
                    </p>
                  )}
                </div>
              )
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text">
                Expiry Date <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={tags["Expiry Date"]}
                onChange={(e) => {
                  setTags((prev) => ({
                    ...prev,
                    "Expiry Date": e.target.value,
                  }));
                  if (tagErrors["Expiry Date"])
                    setTagErrors((prev) => ({
                      ...prev,
                      "Expiry Date": undefined,
                    }));
                }}
                className="w-full h-11 rounded-lg border border-border bg-bg px-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {tagErrors["Expiry Date"] && (
                <p className="mt-1 text-xs text-error">
                  {tagErrors["Expiry Date"]}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-border bg-surface p-5">
          <p className="mb-4 text-sm text-text-muted">
            By submitting, you confirm this configuration is correct. A proof
            report will be generated for your approver.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            size="lg"
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit for Deployment
              </>
            )}
          </Button>
        </div>

        <ConfirmModal
          open={modalOpen}
          proofText={proofText}
          deploymentStatus={deploymentStatus}
          deploymentError={deploymentError}
          onClose={() => setModalOpen(false)}
          onReset={handleReset}
        />
      </div>
    </PageTransition>
  );
```

- [ ] **Step 3: Run review page tests**

```bash
cd web && npm run test -- "review/page.test" --run
```
Expected: all review page tests pass

- [ ] **Step 4: Commit**

```bash
git add web/app/review/page.tsx
git commit -m "feat: review page — h-11 inputs, Breadcrumb, PageTransition"
```

---

## Task 13: Builder Breadcrumb + policy tooltip

**Files:**
- Modify: `web/app/builder/page.tsx`
- Modify: `web/components/builder/ResourceCatalog.tsx`

- [ ] **Step 1: Add Breadcrumb + PageTransition to builder/page.tsx**

Read `web/app/builder/page.tsx`. Add these imports:
```typescript
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageTransition } from "@/components/layout/PageTransition";
```

Wrap the return's outermost element in `<PageTransition>` and add as the first child inside the content area:
```tsx
<Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Builder" }]} />
```

The builder page uses `<div className="flex h-full ...">` or similar layout — add the Breadcrumb inside the main content column, above the `ResourceCatalog`.

- [ ] **Step 2: Replace ResourceCatalog.tsx to show blocked resources with tooltip**

Write `web/components/builder/ResourceCatalog.tsx` in full:

```tsx
"use client";

import { useState } from "react";
import { Search, Lock } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { Badge } from "@/components/ui/Badge";
import { FilterPills } from "@/components/templates/FilterPills";
import type { AzureResource } from "@/types";

interface ResourceCatalogProps {
  resources: AzureResource[];
  selectedTypes: string[];
  onSelect: (resource: AzureResource) => void;
}

export function ResourceCatalog({
  resources,
  selectedTypes,
  onSelect,
}: ResourceCatalogProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = resources.filter((r) => {
    const matchesSearch =
      search === "" ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || r.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search
          aria-hidden="true"
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search resources..."
          aria-label="Search resources"
          className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-4 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <FilterPills selected={category} onChange={setCategory} />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          No resources match your search.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((resource) => {
            if (resource.policyBlocked) {
              return (
                <div
                  key={resource.type}
                  title="Not permitted by COE-Allowed-Resources policy"
                  className="group relative flex cursor-not-allowed items-start gap-3 rounded-xl border border-border bg-surface p-4 opacity-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-border">
                    <DynamicIcon
                      name={resource.icon}
                      className="h-5 w-5 text-text-muted"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text">
                        {resource.name}
                      </p>
                      <Lock
                        className="h-3.5 w-3.5 shrink-0 text-text-muted"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                      {resource.description}
                    </p>
                  </div>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface-elevated px-2 py-1 text-xs text-text opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  >
                    Not permitted by COE-Allowed-Resources policy
                  </span>
                </div>
              );
            }

            const isAdded = selectedTypes.includes(resource.type);
            return (
              <button
                key={resource.type}
                onClick={() => onSelect(resource)}
                className={`group flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  isAdded
                    ? "border-success/30 bg-success/5"
                    : "border-border bg-surface hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-md hover:shadow-accent/5"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    isAdded ? "bg-success/10" : "bg-accent/10"
                  }`}
                >
                  <DynamicIcon
                    name={resource.icon}
                    className={`h-5 w-5 ${isAdded ? "text-success" : "text-accent"}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text">
                      {resource.name}
                    </p>
                    <Badge variant={isAdded ? "success" : "default"}>
                      {isAdded ? "Added" : resource.category}
                    </Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">
                    {resource.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run tests**

```bash
cd web && npm run test --run
```
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add web/app/builder/page.tsx web/components/builder/ResourceCatalog.tsx
git commit -m "feat: builder — Breadcrumb, show policy-blocked resources with lock icon and tooltip"
```

---

## Task 14: Final verification

- [ ] **Step 1: Verify no raw color classes remain**

```bash
grep -rn "text-green-\|text-red-\|text-yellow-\|bg-green-\|bg-red-\|bg-yellow-\|bg-blue-[0-9]" \
  web/app web/components --include="*.tsx"
```
Expected: no matches (all were in my-stuff/page.tsx and ConfirmModal.tsx, both replaced)

- [ ] **Step 2: Run full test suite**

```bash
cd web && npm run test --run
```
Expected: 120+ PASS (115 original + ~11 new), 0 FAIL

- [ ] **Step 3: Run lint**

```bash
cd web && npm run lint
```
Expected: 0 errors, 0 warnings

- [ ] **Step 4: Run type-check**

```bash
cd web && npm run type-check
```
Expected: 0 errors

- [ ] **Step 5: Build**

```bash
cd web && npm run build
```
Expected: successful standalone build, 0 errors

- [ ] **Step 6: Commit any fixes, then archive spec**

If fixes were needed:
```bash
git add -A
git commit -m "fix: address lint/type issues from UI redesign"
```

Move the spec to archive:
```bash
mv docs/superpowers/specs/2026-04-23-ui-redesign-design.md docs/superpowers/archive/specs/
```

```bash
git add -A
git commit -m "chore: archive UI redesign spec — implementation complete"
```

---

## Spec Coverage

| Spec section | Covered |
|---|---|
| Single top navbar (h-16, backdrop blur, Home + Templates links) | Task 4 |
| Breadcrumb on all non-home pages | Tasks 5, 9, 10, 12, 13 |
| Soft blue-gray palette, light-first `:root` | Task 1 |
| `--color-primary` + `--color-primary-hover` tokens | Task 1 |
| IBM Plex Sans / IBM Plex Mono fonts | Task 6 |
| Logo SVG (3×3 dots in rounded square) | Task 3 |
| Footer (48px, border-t, brand text) | Task 5 |
| Page fade transitions | Tasks 5, 8, 9, 10, 12, 13 |
| Home: 3-zone dashboard (welcome, templates, deployments) | Task 8 |
| Home: skeleton loading (3 rows) while fetching | Task 8 |
| Home: "View all" links to Templates and My Stuff | Task 8 |
| Templates page: Scenario Bundles section | Task 9 |
| Templates page: Individual Resources section with filter | Task 9 |
| 4 new bundle templates in templates.json | Task 9 |
| Lucide icons: Layers, GitMerge, ShieldCheck registered | Task 9 |
| My Deployments page: title, skeleton, semantic tokens | Task 10 |
| Review page: h-11 inputs, Breadcrumb | Task 12 |
| ConfirmModal: 4-step status timeline | Task 11 |
| Builder: policy tooltip on blocked resources | Task 13 |
| Remove raw Tailwind color classes | Tasks 10, 11 |
| Delete Sidebar, Nav, Topbar, PageShell | Tasks 6, 7 |
| Delete login page, dead home components | Task 7 |
| Document reorganisation (Section 9) | Already done ✓ |
