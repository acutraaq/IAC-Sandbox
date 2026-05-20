---
description: Design tokens, color values, typography, and component rules for IAC Sandbox frontend. Updated for rig.ai-inspired aesthetic with brighter, readable tokens.
globs: web/**
---

# Design System

## Overview

Internal tool for non-technical EPF staff provisioning Azure infrastructure. Aesthetic: "The Structured Guide" — rig.ai-inspired.

Key characteristics:
- Tonal depth over shadow hierarchy: three surface layers (Foundation, Surface, Elevated), no card shadows
- Pill-shaped interactive affordances: buttons and badges use `rounded-full`; containers use `rounded-md` or `rounded-xl`
- IBM Plex Mono reserved exclusively for machine-generated strings (IDs, resource names, proof text) and chrome elements (eyebrows, section headers)
- Staggered fade-up animations on page entry; state transitions only on components
- Subtle grid background pattern reinforces infrastructure / technical register
- Brighter, readable dark navy palette (not OLED near-black) for comfortable reading

## Colors

### Primary
| Name | Hex | Usage |
|------|-----|-------|
| Electric Cyan | `#0BBDE8` | Primary action color: active nav underline, primary interactive signals |
| Electric Cyan Hover | `#14D0FF` | Hover state for Electric Cyan elements, 150ms ease-out |

### Neutral
| Name | Hex | Usage |
|------|-----|-------|
| Navy Foundation | `#0C1525` | Page background |
| Navy Deep | `#080E1A` | Section bands (problem, comparison, terminal) |
| Navy Surface | `#141E2E` | Card backgrounds, navbar, content containers |
| Navy Elevated | `#1C2739` | Modals, popovers, hover states |
| Navy Highlight | `#182232` | Skeleton states, subtle highlights |
| Ice Text | `#F0F7FF` | All primary readable content |
| Muted Text | `rgba(180,210,235,0.78)` | Secondary labels, placeholders, nav links at rest |
| Faint Text | `rgba(120,170,210,0.40)` | Tertiary / disabled text |

### Borders
| Name | Value | Usage |
|------|-------|-------|
| Border | `rgba(12,200,240,0.10)` | Default card/list borders |
| Border Strong | `rgba(12,200,240,0.22)` | Hover/active borders |
| Border Glow | `rgba(12,200,240,0.45)` | Elevated borders, premium cards |

### Semantic
| Name | Hex | Usage |
|------|-----|-------|
| Error Red | `#FF7A7A` | Validation errors, failed deployment states |
| Success Green | `#4ADE80` | Confirmed deployments, success toasts |
| Warning Amber | `#FBBF24` | Policy notices, expiry date warnings |

### CSS Token Mapping
| CSS Variable | Value | Usage |
|--------------|-------|-------|
| `--color-bg` | `#0C1525` | Page background |
| `--color-bg-deep` | `#080E1A` | Dark section bands |
| `--color-surface` | `#141E2E` | Card backgrounds, navbar |
| `--color-surface-elevated` | `#1C2739` | Modals, popovers, hover states |
| `--color-surface-highlight` | `#182232` | Skeleton/loading states |
| `--color-border` | `rgba(12,200,240,0.10)` | Default borders |
| `--color-border-strong` | `rgba(12,200,240,0.22)` | Hover/active borders |
| `--color-border-glow` | `rgba(12,200,240,0.45)` | Premium/glow borders |
| `--color-text` | `#F0F7FF` | Primary text |
| `--color-text-muted` | `rgba(180,210,235,0.78)` | Secondary text |
| `--color-text-faint` | `rgba(120,170,210,0.40)` | Tertiary text |
| `--color-primary` | `#0BBDE8` | Buttons, active states |
| `--color-primary-hover` | `#14D0FF` | Primary hover |
| `--color-accent` | `#0BBDE8` | Links, highlights |
| `--color-accent-hover` | `#14D0FF` | Accent hover |
| `--color-accent-glow` | `rgba(11,189,232,0.20)` | Glow backgrounds |
| `--color-coral` | `#7E70EE` | Headline accent (indigo) |
| `--color-coral-hover` | `#9A8CFF` | Coral hover |
| `--color-error` | `#FF7A7A` | Errors |
| `--color-success` | `#4ADE80` | Success |
| `--color-warning` | `#FBBF24` | Warnings |
| `--color-prompt` | `#00DFFF` | Terminal-style prompt glyphs (`~/`, `$`) |
| `--color-comment` | `rgba(11,189,232,0.50)` | Mono comment prefix color (`#`) |

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
| `rounded-2xl` | `16px` | CTA sections, premium cards |
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
1. **Foundation** — `--color-bg` (#0C1525) — page background
2. **Surface** — `--color-surface` (#141E2E) — cards, navbar, content containers
3. **Elevated** — `--color-surface-elevated` (#1C2739) — modals, popovers, hover states

### Shadows (floating UI only)
| Token | Value | Usage |
|-------|-------|-------|
| `shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` | Modals only |
| `shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Toasts, dropdowns |

## Components

### Buttons
Pill shape (`rounded-full`). Four variants:
- **Primary:** Electric Cyan fill (`#0BBDE8`), white text, 44px height, 24px horizontal padding. Hover: `#14D0FF`.
- **Secondary:** Transparent fill, Frost Text, `1px solid rgba(12,200,240,0.10)` border. Hover: Navy Elevated background.
- **Ghost:** Transparent fill, Muted Text at rest, Text on hover, Elevated background on hover.
- **Outline-Glow:** Transparent fill, Cyan text, Cyan glow border. Hover: Cyan at ~10% background.
- Focus: 2px Electric Cyan outline, 2px offset. Disabled: 50% opacity.

### Badges
Pill shape (`rounded-full`), 12px font, 500 weight. Semantic colors at 15% opacity background with full-opacity text. No solid-fill badges.

### Cards
- `rounded-xl` (12px) or `rounded-2xl` (16px), Navy Surface background, `1px solid rgba(12,200,240,0.10)` border, 24-32px padding.
- Hoverable: border transitions to `rgba(12,200,240,0.22)`, background to Navy Elevated, 150ms ease-out.
- Optional `glow-border-hover` for premium card elevation.
- **No shadows.**

### Inputs / Fields
- Transparent or surface-tinted background, `1px solid rgba(12,200,240,0.10)` border, 6-8px radius.
- Focus: border brightens to Electric Cyan, 2px outline ring at 2px offset.
- Error: Error Red border + Error Red message below.

### Navigation
- Fixed top bar, 64px height, transparent → glassmorphism on scroll.
- On scroll (> 4px): `bg-surface-glass/80 backdrop-blur-xl border-b border-border/50`.
- Active link: Frost Text, 2px Electric Cyan underline with glow.
- Inactive links: Muted Text at rest, Text on hover.

### Modals
- `rounded-2xl` (16px), Navy Elevated background, `shadow-2xl`, `1px solid rgba(12,200,240,0.45)` border.
- Backdrop: `rgba(0, 0, 0, 0.6)`.
- Header: 48-56px, `1px solid rgba(12,200,240,0.10)` bottom border.

### Toasts
- `rounded-xl` (12px), `shadow-lg`, Navy Elevated background, bottom-right, 24px from viewport edges.

## Do's and Don'ts

### Do:
- Use tonal layering (Foundation → Surface → Elevated) for depth.
- Use `rounded-full` exclusively for buttons and badges.
- Use IBM Plex Mono for machine-generated strings and chrome only.
- Write Label-level text in uppercase with 0.075em tracking for taxonomy.
- Keep body copy under 65 characters per line.
- Use semantic badge colors (success, warning, error) at 15% opacity background.
- Animate with ease-out exponential curves (`cubic-bezier(0.22, 1, 0.36, 1)`). State transitions: 150ms. Page entry: 420ms.
- Scope shadows to modals (`shadow-2xl`) and toasts (`shadow-lg`) only.
- Use brighter Navy (#0C1525) over near-black (#060A12) for comfortable reading.
- Ensure borders are visible enough to distinguish card edges from backgrounds.

### Don't:
- Use gradient text (`background-clip: text`). All text is single solid color.
- Use glassmorphism decoratively. `backdrop-blur` only on scrolled navbar (structural).
- Use side-stripe borders (`border-left` > 1px colored on cards/lists).
- Invent a fourth surface layer. Foundation, Surface, Elevated are complete.
- Apply box-shadows to cards, section containers, or nav elements.
- Use sharp corners or fully square buttons — pill shape is the affordance signal.
- Use IBM Plex Mono for UI copy, headings, or labels (except chrome).
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
- Numbered labels (`01`, `02`, etc.) in FAQ and problem blocks

Body copy, button labels, form labels, error messages, and toast text remain IBM Plex Sans. This exception is intentional and bounded — do not extend mono further without revising this section.
