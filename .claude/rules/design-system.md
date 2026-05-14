---
description: Design tokens, color values, typography, and component rules for IAC Sandbox frontend. Matches DESIGN.md exactly.
globs: web/**
---

# Design System

## Overview

Internal tool for non-technical EPF staff provisioning Azure infrastructure. Aesthetic: "The Structured Guide."

Key characteristics:
- Tonal depth over shadow hierarchy: three surface layers (Foundation, Surface, Elevated), no card shadows
- Pill-shaped interactive affordances: buttons and badges use `rounded-full`; containers use `rounded-md` or `rounded-xl`
- IBM Plex Mono reserved exclusively for machine-generated strings (IDs, resource names, proof text)
- Staggered fade-up animations on page entry; state transitions only on components
- Subtle grid background pattern reinforces infrastructure / technical register

## Colors

### Primary
| Name | Hex | Usage |
|------|-----|-------|
| Clarity Blue | `#2b7fd4` | Primary action color: active nav underline, avatar background, primary interactive signals |
| Clarity Blue Hover | `#3a8ee3` | Hover state for Clarity Blue elements, 150ms ease-out |
| Sky Accent | `#4a9be0` | Links, logo, focus rings, interactive highlights |
| Sky Accent Hover | `#5aaef0` | Hover state for Sky Accent elements, 150ms ease-out |

### Neutral
| Name | Hex | Usage |
|------|-----|-------|
| Azure Foundation | `#22324a` | Page background |
| Azure Surface | `#2c4262` | Card backgrounds, navbar fill, mobile menu |
| Azure Elevated | `#375577` | Modals, popovers, ghost/secondary button hover background |
| Frost Text | `#e0eaf8` | All primary readable content |
| Muted Text | `rgba(175, 210, 245, 0.82)` | Secondary labels, placeholders, nav links at rest |
| Faint Text | `rgba(140, 180, 230, 0.45)` | Tertiary / disabled text |

### Semantic
| Name | Hex | Usage |
|------|-----|-------|
| Error Red | `#ef4444` | Validation errors, failed deployment states |
| Success Green | `#22c55e` | Confirmed deployments, success toasts |
| Warning Amber | `#f59e0b` | Policy notices, expiry date warnings |

### CSS Token Mapping
| CSS Variable | Value | Usage |
|--------------|-------|-------|
| `--color-bg` | `#22324a` | Page background |
| `--color-surface` | `#2c4262` | Card backgrounds, navbar |
| `--color-surface-elevated` | `#375577` | Modals, popovers, hover states |
| `--color-border` | `rgba(44, 127, 212, 0.25)` | Default borders |
| `--color-border-strong` | `rgba(74, 155, 224, 0.40)` | Hover/active borders |
| `--color-text` | `#e0eaf8` | Primary text |
| `--color-text-muted` | `rgba(175, 210, 245, 0.82)` | Secondary text |
| `--color-text-faint` | `rgba(140, 180, 230, 0.45)` | Tertiary text |
| `--color-primary` | `#4a9be0` | Buttons, active states |
| `--color-primary-hover` | `#5aaef0` | Primary hover |
| `--color-accent` | `#4a9be0` | Links, highlights |
| `--color-accent-hover` | `#5aaef0` | Accent hover |
| `--color-error` | `#ef4444` | Errors |
| `--color-success` | `#22c55e` | Success |
| `--color-warning` | `#f59e0b` | Warnings |
| `--color-prompt` | `#5aaef0` | Terminal-style prompt glyphs (`~/`, `$`) |
| `--color-comment` | `rgba(175, 210, 245, 0.50)` | Mono comment prefix color (`#`) |

## Typography

**Body Font:** IBM Plex Sans (weights: 400, 500, 600, 700)
**Mono Font:** IBM Plex Mono (weights: 400, 500) — machine-generated strings only

| Level | Weight | Size | Line Height | Letter Spacing | Usage |
|-------|--------|------|-------------|----------------|-------|
| Display | 700 | 2.25rem / 36px | 1.15 | -0.01em | Page titles only, max one per page |
| Headline | 600 | 1.5rem / 24px | 1.3 | — | Section headings in multi-step flows |
| Title | 600 | 1.125rem / 18px | 1.4 | — | Card headings, modal titles, form group labels |
| Body | 400 | 0.875rem / 14px | 1.6 | — | All descriptive text, table data. Max 65ch per line |
| Label | 600 | 0.75rem / 12px | 1.4 | 0.075em | Section category headers, meta labels. Uppercase only |
| Mono | 400 | 0.875rem / 14px | 1.6 | — | Submission IDs, resource group names, ARM tags, proof artifact |

## Rounded

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | `4px` | Small UI elements |
| `rounded-md` | `6px` | Cards, inputs, pre blocks |
| `rounded-lg` | `8px` | Larger containers |
| `rounded-xl` | `12px` | Modals, toasts |
| `rounded-full` | `9999px` | Buttons, badges exclusively |

## Spacing

| Token | Value |
|-------|-------|
| `xs` | `4px` |
| `sm` | `8px` |
| `md` | `16px` |
| `lg` | `24px` |
| `xl` | `32px` |
| `2xl` | `48px` |

## Elevation

Three tonal layers only:
1. **Foundation** — `--color-bg` (#22324a) — page background
2. **Surface** — `--color-surface` (#2c4262) — cards, navbar, content containers
3. **Elevated** — `--color-surface-elevated` (#375577) — modals, popovers, hover states

### Shadows (floating UI only)
| Token | Value | Usage |
|-------|-------|-------|
| `shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` | Modals only |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Toasts, dropdowns |

## Components

### Buttons
Pill shape (`rounded-full`). Three variants:
- **Primary:** Sky Accent fill (`#4a9be0`), white text, 44px height, 24px horizontal padding. Hover: Sky Accent Hover (`#5aaef0`).
- **Secondary:** Transparent fill, Frost Text, `1px solid rgba(44, 127, 212, 0.25)` border. Hover: Azure Elevated background.
- **Ghost:** Transparent fill, Muted Text at rest, Frost Text on hover, Azure Elevated background on hover.
- Focus: 2px Sky Accent outline, 2px offset. Disabled: 50% opacity.

### Badges
Pill shape (`rounded-full`), 12px font, 500 weight. Semantic colors at 15% opacity background with full-opacity text. No solid-fill badges.

### Cards
- `rounded-md` (6px), Azure Surface background, `1px solid rgba(44, 127, 212, 0.25)` border, 24px padding.
- Hoverable: border transitions to `rgba(74, 155, 224, 0.25)`, background to Azure Elevated, 150ms ease-out.
- **No shadows.**

### Inputs / Fields
- Transparent or surface-tinted background, `1px solid rgba(44, 127, 212, 0.25)` border, 6-8px radius.
- Focus: border brightens to Sky Accent, 2px outline ring at 2px offset.
- Error: Error Red border + Error Red message below.

### Navigation
- Fixed top bar, 64px height, Azure Surface background, `1px solid rgba(44, 127, 212, 0.25)` bottom border.
- On scroll (> 4px): structural `backdrop-blur-md`, Surface at 90% opacity.
- Active link: Frost Text, 2px Clarity Blue underline at `bottom: -2px`, Framer Motion `layoutId`.
- Inactive links: Muted Text at rest, Frost Text on hover.

### Modals
- `rounded-xl` (12px), Azure Elevated background, `shadow-2xl`, `1px solid rgba(44, 127, 212, 0.25)` border.
- Backdrop: `rgba(0, 0, 0, 0.6)`.
- Header: 48-56px, `1px solid rgba(44, 127, 212, 0.25)` bottom border.

### Toasts
- `rounded-xl` (12px), `shadow-lg`, Azure Elevated background, bottom-right, 24px from viewport edges.

## Do's and Don'ts

### Do:
- Use tonal layering (Foundation → Surface → Elevated) for depth.
- Use `rounded-full` exclusively for buttons and badges.
- Use IBM Plex Mono for machine-generated strings only.
- Write Label-level text in uppercase with 0.075em tracking for taxonomy.
- Keep body copy under 65 characters per line.
- Use semantic badge colors (success, warning, error) at 15% opacity background.
- Animate with ease-out exponential curves (`cubic-bezier(0.22, 1, 0.36, 1)`). State transitions: 150ms. Page entry: 420ms.
- Scope shadows to modals (`shadow-2xl`) and toasts (`shadow-lg`) only.

### Don't:
- Use gradient text (`background-clip: text`). All text is single solid color.
- Use glassmorphism decoratively. `backdrop-blur` only on scrolled navbar (structural).
- Use side-stripe borders (`border-left` > 1px colored on cards/lists).
- Invent a fourth surface layer. Foundation, Surface, Elevated are complete.
- Apply box-shadows to cards, section containers, or nav elements.
- Use sharp corners or fully square buttons — pill shape is the affordance signal.
- Use IBM Plex Mono for UI copy, headings, or labels.
- Use flashy SaaS patterns: gradient fills, hero metrics, decorative animation.
- Use neon accents, cyberpunk aesthetics, or glowing dark-mode treatments.
- Build identical card grids (same icon + heading + body text repeated endlessly).
- Use `bg-glass`, `border-glass`, `glow-pulse`, `text-gradient`, or `text-gradient-shimmer` utilities. These are BANNED.

### Mono Boundary — Documented Exception

The Mono Boundary Rule (IBM Plex Mono = machine-generated strings only) is widened to also include navigation chrome and section headers in the Terminal-Native Document treatment:

- The `~/path` page eyebrow (top-of-page route indicator)
- Section headers prefixed with `##` (e.g., `## popular-templates`)
- Navbar wordmark (`~/sandbox`)
- Footer single-line meta

Body copy, button labels, form labels, error messages, and toast text remain IBM Plex Sans. This exception is intentional and bounded — do not extend mono further without revising this section.
