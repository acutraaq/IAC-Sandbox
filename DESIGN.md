---
name: IAC Sandbox
description: Internal Azure IaC deployment tool — warm cream paper canvas with a dusty-azure accent and an amber CRT-terminal easter egg
colors:
  warm-cream-paper: "#F7F2E8"
  deep-cream: "#EEE8D8"
  cream-surface: "#EDE6D6"
  elevated-cream: "#E4DCCB"
  highlight-cream: "#E8E1D0"
  border-sepia: "rgba(90, 65, 30, 0.12)"
  border-sepia-strong: "rgba(90, 65, 30, 0.24)"
  border-sepia-glow: "rgba(90, 65, 30, 0.40)"
  deep-warm-charcoal: "#1C1710"
  charcoal-muted: "rgba(55, 42, 22, 0.62)"
  charcoal-faint: "rgba(55, 42, 22, 0.32)"
  dusty-azure: "#3D6FA8"
  dusty-azure-hover: "#4A82C4"
  azure-glow: "rgba(61, 111, 168, 0.14)"
  muted-sage: "#4E7A55"
  muted-sage-hover: "#3D6344"
  error-red: "#B91C1C"
  success-green: "#2D6A35"
  warning-amber: "#B45309"
  cream-on-accent: "#FDF8F0"
  terminal-bg: "#1E1208"
  terminal-bg-deep: "#160E05"
  terminal-text: "#EAD9C0"
  terminal-muted: "#7A6040"
  terminal-dim: "#4A3018"
  terminal-accent: "#C47820"
  terminal-success: "#7A9A40"
typography:
  display:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  pill: "9999px"
  card: "0.75rem"
  modal: "1rem"
  badge: "9999px"
spacing:
  gap-tight: "0.5rem"
  gap-sm: "1rem"
  gap-md: "1.5rem"
  gap-lg: "3rem"
  section-y: "2rem"
  section-y-md: "3rem"
  container-max: "80rem"
components:
  button-primary:
    backgroundColor: "{colors.dusty-azure}"
    textColor: "{colors.cream-on-accent}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.dusty-azure-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.deep-warm-charcoal}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "2.75rem"
  card:
    backgroundColor: "{colors.cream-surface}"
    textColor: "{colors.deep-warm-charcoal}"
    rounded: "{rounded.card}"
    padding: "1.5rem"
  badge-default:
    backgroundColor: "{colors.highlight-cream}"
    textColor: "{colors.deep-warm-charcoal}"
    rounded: "{rounded.badge}"
    padding: "0.125rem 0.625rem"
  modal:
    backgroundColor: "{colors.elevated-cream}"
    textColor: "{colors.deep-warm-charcoal}"
    rounded: "{rounded.modal}"
    padding: "1.25rem 1.5rem"
---

# Design System: IAC Sandbox

## 1. Overview

**Creative North Star: "The Sepia Draft Table"**

A deployment tool that reads like a warm paper form on an engineer's desk, not a SaaS dashboard. The canvas is cream, the ink is charcoal, and the one moment of color — a dusty, muted azure — is reserved for the thing the user is actually about to do: submit, confirm, deploy. Every other pixel stays quiet on purpose, because per PRODUCT.md the users are non-technical EPF staff filling in a form mid-workday who "want their resources, not a product tour."

One deliberate exception: `TerminalHero` and `AsciiTerminal` drop into a dark amber CRT palette inside their own bounded card, evoking an old terminal session. It's an isolated motif, not a second theme — the moment it ends, the page returns to cream paper.

This system explicitly rejects: consumer-SaaS gradients and hero-metric tiles, Azure Portal-style panel-on-panel chrome, neon cyberpunk saturation, and dashboards that animate for their own sake — motion here should be nearly invisible (per PRODUCT.md's anti-references).

**Key Characteristics:**
- Warm, tinted-cream neutrals — never pure white or pure black
- Single accent (dusty azure) carries interactive/primary meaning; nothing else competes for it
- Flat surfaces, tonal layering instead of shadows
- Mono type reserved for machine-generated or terminal-flavored strings only
- One contained dark/amber motif (`TerminalHero`, `AsciiTerminal`), never bleeding into the rest of the page

## 2. Colors

Strategy: **Restrained**. One accent, tinted-cream neutral scale, a muted sage secondary used sparingly for badges/labels.

### Primary
- **Dusty Azure** (`#3D6FA8`, hover `#4A82C4`): primary buttons, links, focus rings, the terminal `$` prompt glyph. Verified ≥4.6:1 against the cream background and ≥5.2:1 as white-on-fill. This is the only color that means "act here."

### Secondary
- **Muted Sage** (`#4E7A55`, hover `#3D6344`): a second badge/label voice (`--color-coral` token name is historical, value is sage green) — used for section eyebrows and categorical badges that shouldn't compete with the azure accent.

### Neutral
- **Warm Cream Paper** (`#F7F2E8`): page background.
- **Deep Cream** (`#EEE8D8`): alternating section bands (`border-y border-border/30 bg-bg-deep`).
- **Cream Surface** (`#EDE6D6`): cards, navbar.
- **Elevated Cream** (`#E4DCCB`): modals, popovers.
- **Highlight Cream** (`#E8E1D0`): hover states on surfaces.
- **Sepia Hairline** (`rgba(90,65,30,0.12)` / `0.24` strong / `0.40` glow): all borders — never gray, always warmed toward the sepia ink.
- **Deep Warm Charcoal** (`#1C1710`): primary text.
- **Charcoal Muted** (`rgba(55,42,22,0.62)`) / **Charcoal Faint** (`rgba(55,42,22,0.32)`): secondary text, placeholders, disabled.

### Semantic
- **Error** (`#B91C1C`), **Success** (`#2D6A35`), **Warning** (`#B45309`) — status only, never decorative.

### Terminal Exception
- **Terminal Amber** family (`#1E1208` bg, `#EAD9C0` text, `#C47820` accent, `#7A9A40` success, `#7A6040`/`#4A3018` muted/dim): scoped entirely to `TerminalHero.tsx` and `AsciiTerminal.tsx`. Currently hardcoded per-component rather than tokenized — both files duplicate the same ~10 values verbatim. Consolidating into shared CSS vars (`--terminal-bg`, `--terminal-text`, etc.) is an open cleanup, not yet done.

### Named Rules
**The One Ink Rule.** Dusty azure is the only color allowed to signal "primary action." Sage, amber, and semantic colors never substitute for it, even in disabled or secondary contexts.

**The Warm Neutral Rule.** No neutral in this system is gray. Every background, border, and text-muted value is sepia- or cream-tinted. A pure `#fff`/`#000`/gray-scale value anywhere is a bug.

## 3. Typography

**Body Font:** IBM Plex Sans (400, 500, 600, 700), system-ui fallback
**Label/Mono Font:** IBM Plex Mono (400, 500) — reserved for machine-generated strings (submission IDs, resource names, proof-artifact text) and nav eyebrows, never for prose

**Character:** A technical grotesque paired with a typewriter mono — precise and legible, no display flourish. The mono face is the tell that "this is a real system output," so it's rationed deliberately.

### Hierarchy
- **Display** (700, `clamp(2rem, 5vw, 3.75rem)`, 1.1): hero headline only.
- **Headline** (700, `clamp(1.5rem, 3vw, 2.25rem)`, 1.1, tight tracking): section headers.
- **Title** (600, 1.125rem): card/modal/wizard-step titles.
- **Body** (400, 1.0625rem base, 1.7 line-height): running copy, capped at 65–75ch.
- **Label** (500–600, 0.75rem, `0.12em` tracking, uppercase, mono): eyebrows, micro-labels, stat captions.

### Named Rules
**The Mono-Means-Machine Rule.** IBM Plex Mono only ever wraps something the system generated (an ID, a resource name, terminal output) or a structural eyebrow label — never a sentence a human wrote.

## 4. Elevation

Flat by default, no ambient shadows on cards. Depth comes from cream tonal layering (paper → surface → elevated) plus warm hairline borders, not `box-shadow`. Shadows appear only where a layer needs to visually detach from the page: modals and toasts.

### Shadow Vocabulary
- **Glow border** (`box-shadow: 0 0 0 1px rgba(61,111,168,0.12), 0 0 24px rgba(61,111,168,0.04)`, hover `0.18`/`0.08`): the one deliberate glow, used on the outline-glow button variant and glow-enabled cards. Azure-tinted, not neutral.
- **Modal** (`shadow-2xl` + the glow-border class above): the only component allowed a real drop shadow, because it's the only element meant to feel lifted off the page.

### Named Rules
**The Flat-By-Default Rule.** Cards, badges, and inputs never cast a shadow. If something needs to stand out, promote it a tonal layer (surface → elevated) before reaching for `box-shadow`.

## 5. Components

### Buttons
- **Shape:** fully rounded (`rounded-full` / `9999px`), `h-11` (`h-14` for the large variant), `gap-2` between icon and label.
- **Primary:** azure fill (`#3D6FA8`), cream text (`#FDF8F0`), `hover:#4A82C4`, `active:scale-[0.98]`.
- **Secondary:** transparent, sepia hairline border, `hover:bg-surface-elevated`.
- **Ghost:** transparent, text-only, `hover:bg-surface-elevated`.
- **Outline-glow:** sepia-glow border plus the azure glow-border shadow, `hover:bg-accent-glow`.
- **Focus:** `outline-2 outline-offset-2`, azure outline color — applies system-wide via `:focus-visible`, not just buttons.

### Badges
- **Style:** fully rounded, `px-2.5 py-0.5`, `text-xs font-medium`.
- **State:** default is `bg-surface-highlight` with a plain hairline border; semantic variants (accent/success/warning/error) use a 15% color wash background with a 25% color border — never a solid fill.

### Cards
- **Corner Style:** `rounded-xl` (0.75rem).
- **Background:** cream surface, hairline border, no shadow.
- **Hover:** border shifts to sepia-strong, background steps up to elevated-cream; optional glow variant adds the azure glow-border shadow.
- **Internal Padding:** caller-supplied, no baked-in default.

### Inputs / Fields
- **Style:** transparent or surface-tinted background, sepia hairline border, no radius flourish beyond the shared card radius.
- **Focus:** 2px azure ring via the global `:focus-visible` rule, not a bespoke per-input treatment.
- **Error:** border and helper text switch to `--color-error`; labels stay always-visible (never placeholder-only), per PRODUCT.md's accessibility requirement.

### Navigation
- Mono eyebrow-style breadcrumbs (`~/path` convention), cream surface bar, azure active-state underline/text, no heavy chrome — direct rejection of the Azure Portal anti-reference.

### Modals
- **Corner Style:** `rounded-2xl` (1rem).
- **Background:** elevated-cream, sepia-glow border, `shadow-2xl` plus the azure glow-border shadow.
- **Motion:** overlay fades; panel scales `0.95→1` and rises `10px→0`, `150ms`, ease `[0.22, 1, 0.36, 1]` (ease-out-expo). No bounce.
- **Close affordance:** fully rounded hit target, minimum 40px tap size.

### Terminal Motif (signature component)
`TerminalHero` / `AsciiTerminal` render a self-contained dark amber terminal card (mac traffic-light dots, blinking cursor, typewriter prompt lines) as a bounded illustration of the product's technical register — not a second app theme. Colors are currently hardcoded per-file rather than tokenized (see Colors → Terminal Exception).

## 6. Do's and Don'ts

### Do:
- **Do** keep every neutral tinted warm — cream backgrounds, sepia borders, charcoal text. No gray-scale values anywhere.
- **Do** reserve dusty azure (`#3D6FA8`) for primary actions, links, and focus rings only.
- **Do** keep motion nearly invisible: 150ms state transitions, 350–420ms entrances, ease-out-expo, no bounce or elastic easing (per PRODUCT.md: "motion should be invisible").
- **Do** keep labels always visible on form fields, never placeholder-only (accessibility requirement).
- **Do** treat the terminal amber motif as a contained illustration, bounded to its own card.

### Don't:
- **Don't** introduce consumer-SaaS patterns: gradients, hero-metric tiles, feature-marketing copy, mascots (explicit PRODUCT.md anti-reference).
- **Don't** build Azure Portal-style heavy UI: stacked panels, dense chrome, nested toolbars (explicit PRODUCT.md anti-reference).
- **Don't** reach for neon or cyberpunk saturation anywhere outside the bounded terminal motif (explicit PRODUCT.md anti-reference).
- **Don't** over-animate: no choreographed entrances, no scroll-driven sequences, no decorative looping motion outside status indicators (explicit PRODUCT.md anti-reference).
- **Don't** use `border-left`/`border-right` as a colored accent stripe anywhere.
- **Don't** let the terminal amber palette leak into any component outside `TerminalHero`/`AsciiTerminal`.
- **Don't** use pure `#000`/`#fff` or untinted gray — every neutral in this system carries a sepia or cream tint.
