# Dark-Only Theme Design

**Date:** 2026-04-30  
**Status:** Approved  
**Author:** Izzat Nasri

---

## Summary

Remove light mode entirely. The app ships with a single dark colour palette ("Lighter Dark" / option C), hardcoded in `:root`. The `ThemeToggle` component and all light-mode CSS tokens are deleted.

---

## Motivation

- Internal admin tool — dark mode is standard and preferred
- Eliminates dual token sets, `data-theme` attribute juggling, and flash-of-unstyled-content concerns
- Simplifies CSS and removes a client-side component

---

## Colour Tokens (new `:root`)

| Token | Value | Note |
|-------|-------|------|
| `--color-bg` | `#22324a` | Page background |
| `--color-surface` | `#2c4262` | Card backgrounds |
| `--color-surface-elevated` | `#375577` | Modals, popovers |
| `--color-border` | `rgba(44, 127, 212, 0.25)` | Borders |
| `--color-border-strong` | `rgba(44, 127, 212, 0.40)` | Strong borders |
| `--color-text` | `#e0eaf8` | Primary text |
| `--color-text-muted` | `rgba(175, 210, 245, 0.82)` | Secondary text |
| `--color-primary` | `#2b7fd4` | Buttons, active states |
| `--color-primary-hover` | `#3a8ee3` | Primary hover |
| `--color-accent` | `#4a9be0` | Links, highlights |
| `--color-accent-hover` | `#5aaef0` | Accent hover |
| `--color-error` | `#ef4444` | Errors |
| `--color-success` | `#22c55e` | Success |
| `--color-warning` | `#f59e0b` | Warnings |

The grid overlay on `body` (`rgba(44, 127, 212, 0.03)`) is retained as-is.

---

## Files Changed

| File | Change |
|------|--------|
| `web/app/globals.css` | Replace two-block theme system with single `:root` using tokens above; delete `html[data-theme="dark"]` block |
| `web/components/layout/ThemeToggle.tsx` | Delete file |
| `web/components/layout/Navbar.tsx` | Remove `ThemeToggle` import and `<ThemeToggle />` JSX |
| `web/app/layout.tsx` | Remove `suppressHydrationWarning` from `<html>` |
| `CLAUDE.md` | Update design system token table to dark-only |

---

## Out of Scope

- No changes to Tailwind config, `@theme inline` block, or any component's class usage — all components already use CSS variables
- No test changes — theme logic has no test coverage and the toggle component has none
- No accessibility audit — out of scope for this change; the chosen palette meets reasonable contrast ratios for an internal tool
