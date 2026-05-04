---
name: Sandbox IAC
description: Azure IaC deployment platform for EPF — structured guidance for non-technical infrastructure provisioning.
colors:
  azure-foundation: "#22324a"
  azure-surface: "#2c4262"
  azure-elevated: "#375577"
  clarity-blue: "#2b7fd4"
  clarity-blue-hover: "#3a8ee3"
  sky-accent: "#4a9be0"
  sky-accent-hover: "#5aaef0"
  frost-text: "#e0eaf8"
  error-red: "#ef4444"
  success-green: "#22c55e"
  warning-amber: "#f59e0b"
typography:
  display:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.075em"
  mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.sky-accent}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "0 1.5rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.sky-accent-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "0 1.5rem"
    height: "2.75rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.frost-text}"
    rounded: "{rounded.full}"
    padding: "0 1.5rem"
    height: "2.75rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.frost-text}"
    rounded: "{rounded.full}"
    padding: "0 1.5rem"
    height: "2.75rem"
  card:
    backgroundColor: "{colors.azure-surface}"
    rounded: "{rounded.md}"
    padding: "1.5rem"
  card-hoverable:
    backgroundColor: "{colors.azure-surface}"
    rounded: "{rounded.md}"
    padding: "1.5rem"
---

# Design System: Sandbox IAC

## 1. Overview

**Creative North Star: "The Structured Guide"**

Sandbox IAC is an internal tool for non-technical EPF staff who need to provision Azure infrastructure without understanding it. The interface plays the role of a knowledgeable colleague who has pre-arranged the process: questions are asked in the right order, options are scoped to what's relevant for this step, and feedback is honest and immediate. The experience reduces cognitive load — not by hiding complexity, but by sequencing it.

The system is dark. Not because tools look cool dark, but because the physical scene demands it: a project manager in a modern office environment opening this tool alongside Azure Portal and their project planning software. Dark surfaces reduce eye strain, align with developer-adjacent tooling expectations, and let the UI recede so that the user's decisions — template choice, configuration, confirmation — occupy the visual foreground. This is not a consumer app.

The aesthetic is deliberately restrained. IBM Plex Sans and IBM Plex Mono establish technical credibility without coldness. The azure-blue palette anchors the tool in the Azure ecosystem without mimicking it. Tonal surface layering (Foundation, Surface, Elevated) communicates depth without shadows. The sky-accent blue appears only where the interface is asking for action — it is never decorative. Every element exists because it earns its place.

**Key Characteristics:**
- Tonal depth over shadow hierarchy: three surface layers, no card shadows
- Pill-shaped interactive affordances: buttons and badges are round; containers are not
- IBM Plex Mono reserved exclusively for machine-generated strings (IDs, resource names, proof text)
- Staggered fade-up animations on page entry; state transitions only on components
- Subtle 48px grid background pattern reinforces the infrastructure / technical register

## 2. Colors: The Azure-Native Palette

A restrained strategy: deep navy surfaces with a single azure accent that signals action. The accent appears in under 10% of any given screen. Its rarity is the point.

### Primary
- **Clarity Blue** (`#2b7fd4`): Primary action color used on the active nav underline, avatar background, and any primary interactive signal. One tier deeper than the accent; reserved for "this is the thing you came here to do."
- **Sky Accent** (`#4a9be0`): Links, logo, focus rings, and interactive highlights. The dominant interactive signal in the system. Lighter and more approachable than Clarity Blue; appears wherever the interface says "you can act here."
- **Sky Accent Hover** (`#5aaef0`): Hover state for accent-colored elements. 150ms ease-out transition.

### Neutral
- **Azure Foundation** (`#22324a`): Page background. Deep desaturated navy, slightly tinted toward the azure hue. The canvas everything else sits on.
- **Azure Surface** (`#2c4262`): Card backgrounds, navbar fill, mobile menu. One step lifted from the foundation.
- **Azure Elevated** (`#375577`): Modals, popovers, ghost/secondary button hover background. The highest tonal layer — reserved for elements that must read above surface content.
- **Frost Text** (`#e0eaf8`): All primary readable content. Cool, slightly blue-tinted white.
- **Muted Text** (`rgba(175, 210, 245, 0.82)`): Secondary labels, placeholders, nav links at rest, supporting descriptions. The alpha value allows it to adapt to any surface layer.

### Semantic
- **Error Red** (`#ef4444`): Validation errors, failed deployment states, policy-blocked notices.
- **Success Green** (`#22c55e`): Confirmed deployments, success toasts, completed steps.
- **Warning Amber** (`#f59e0b`): Policy notices, expiry date warnings, non-blocking cautions.

### Named Rules
**The Clarity Rule.** Sky Accent (`#4a9be0`) appears only on interactive and navigational elements: links, the logo, focus rings, active states, badge fills. It is never used as a decorative color. Its presence means "something you can do."

**The Tonal Grid Rule.** There are exactly three surface layers — Foundation, Surface, Elevated. No surface sits on more than one layer. Nested cards are forbidden. If you need a third level of containment, the design is wrong.

## 3. Typography

**Body Font:** IBM Plex Sans (weights: 400, 500, 600, 700)
**Mono Font:** IBM Plex Mono (weights: 400, 500)

**Character:** IBM Plex Sans is technical without being cold — it reads clearly at small sizes while retaining enough personality to distinguish this from a generic enterprise tool. The mono pairing (IBM Plex Mono) is reserved for machine-generated text: submission IDs, resource group names, ARM tags, proof artifact content. The moment you see mono, you know you're reading output, not interface copy.

### Hierarchy
- **Display** (700, 2.25rem / 36px, lh 1.15, ls -0.01em): Page titles only. Used once per page at most. "Sandbox" on the home page. High visual weight that anchors the screen.
- **Headline** (600, 1.5rem / 24px, lh 1.3): Section headings within multi-step flows. Wizard step titles.
- **Title** (600, 1.125rem / 18px, lh 1.4): Card headings, modal titles, form group labels.
- **Body** (400, 0.875rem / 14px, lh 1.6): All descriptive text, wizard step content, field descriptions, table data. Maximum line length: 65ch.
- **Label** (600, 0.75rem / 12px, 0.075em tracking, uppercase): Section category headers, meta labels, status keys. Used sparingly — only for genuine taxonomy, never for general emphasis.
- **Mono** (400, 0.875rem / 14px, lh 1.6): Submission IDs, resource group names, ARM tags, copy-paste proof artifact text. Never used for UI copy.

### Named Rules
**The Weight Hierarchy Rule.** Every typographic level must differ from its neighbor by at least one font-weight step (400, 500, 600, 700) AND at least 1.25x in size. Flat hierarchies — same size, different color — are prohibited.

**The Mono Boundary Rule.** IBM Plex Mono is reserved for machine-generated strings. It never appears in headings, body copy, labels, or button text. If it's something a human wrote, it's IBM Plex Sans.

## 4. Elevation

This system uses tonal layering, not shadow hierarchy. Depth is communicated through surface progression (Foundation to Surface to Elevated), not box-shadows. The three tonal layers are the entire elevation vocabulary for static content.

Shadows appear only on floating UI elements that physically escape normal document flow:

### Shadow Vocabulary
- **Structural** (`shadow-2xl` / `0 25px 50px -12px rgba(0,0,0,0.25)`): Modals only. Signals the element has fully escaped the page layer and demands attention.
- **Floating** (`shadow-lg` / `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)`): Toasts and dropdown menus. Signals ephemeral floating UI that will dismiss.

### Named Rules
**The Tonal Depth Rule.** Depth lives in surface color, not shadows. If you're reaching for a box-shadow on a card or section container, use the next tonal surface layer instead.

**The Shadow Exception Rule.** Shadows are permitted only on elements that physically float above the page: modals, toasts, dropdown menus, popovers. Every other surface is flat at rest.

## 5. Components

### Buttons
Fully rounded pill shape (`border-radius: 9999px`). The pill is the only element in the system that uses full rounding — it is the primary differentiator between interactive affordances and static containers. Three variants:

- **Primary:** Sky Accent (`#4a9be0`) fill, white text, 44px height (md), 24px horizontal padding. Hover: Sky Accent Hover (`#5aaef0`), 150ms ease-out.
- **Secondary:** Transparent fill, Frost Text, `1px solid rgba(44, 127, 212, 0.25)` border. Hover: Azure Elevated background. Same pill shape and height.
- **Ghost:** Transparent fill, Muted Text at rest, Frost Text on hover, Azure Elevated background on hover. Used for tertiary actions (e.g., "Request Custom Setup").
- **All states:** `focus-visible` ring — 2px Sky Accent outline, 2px offset. Disabled: 50% opacity, pointer-events none.

### Badges / Status Chips
Pill shape (`border-radius: 9999px`), 12px font, 500 weight. Five variants using semantic colors at 15% opacity as background with full-opacity text: default, accent, success, warning, error. No solid-fill badges — tinted backgrounds keep them lightweight and let the surface color show through.

### Cards
- **Shape:** 6px radius (`rounded-md`). Smaller than modals and toasts — cards are content containers, not floating UI.
- **Background:** Azure Surface (`#2c4262`).
- **Border:** `1px solid rgba(44, 127, 212, 0.25)`. Subtle; defines the card without visual heaviness.
- **Padding:** 24px.
- **Hoverable variant:** Border transitions to `rgba(74, 155, 224, 0.25)`, background transitions to Azure Elevated on hover. 150ms ease-out.
- No shadows on cards. Tonal layering communicates containment.

### Inputs / Fields
- **Style:** Transparent or surface-tinted background, `1px solid rgba(44, 127, 212, 0.25)` border, 6-8px radius.
- **Focus:** Border brightens to Sky Accent, 2px outline ring in Sky Accent at 2px offset.
- **Error:** Border becomes Error Red, error message in Error Red below the field.
- **Disabled:** 50% opacity, not-allowed cursor.

### Navigation
- **Shell:** Fixed top bar, 64px height, Azure Surface background, `1px solid rgba(44, 127, 212, 0.25)` bottom border.
- **Scroll behavior:** On scroll (> 4px), `backdrop-blur-md` applied, Surface at 90% opacity. Structural, not decorative.
- **Active link:** Frost Text, 2px Clarity Blue underline at `bottom: -2px`, animated via Framer Motion `layoutId` for smooth route transitions.
- **Inactive links:** Muted Text at rest, Frost Text on hover. No background highlight.
- **Logo:** SVG 3x3 dot grid in a 4px-radius Sky Accent-stroked box. Paired with "Sandbox" wordmark at Title weight.
- **Mobile:** Animated height collapse, same Azure Surface background, `1px solid rgba(44, 127, 212, 0.25)` border-top.

### Modals
- **Shape:** 12px radius (`rounded-xl`). Larger than cards — signals floating, elevated context.
- **Background:** Azure Elevated (`#375577`), `shadow-2xl`, `1px border-border`.
- **Backdrop:** `rgba(0, 0, 0, 0.6)`. Full viewport overlay.
- **Header:** Fixed 48-56px, `1px border-b border-border`. Title at Title weight. Close button: ghost icon, 8px radius, hover reveals Surface background.
- **Body:** Scrollable, 20-24px horizontal padding, 16-20px vertical padding.
- **Entry/exit:** Framer Motion — 150ms, scale 0.95 to 1, y: 10 to 0, opacity 0 to 1.

### Toasts
- **Shape:** 12px radius (`rounded-xl`), `shadow-lg`. Bottom-right, 24px from viewport edges.
- **Background:** Azure Elevated, `1px border-border`.
- **Entry/exit:** Slide from right (x: 40 to 0), 5s auto-dismiss.
- **Icon + text + dismiss button** layout. Icons use semantic colors (success/error/warning). Dismiss: ghost icon button.

### Signature Component: Proof Artifact Block
The deployment proof artifact — shown in ConfirmModal after submission — renders in IBM Plex Mono on a slightly deeper surface. Monospaced key-value pairs, copyable as plain text. This is the only context where Mono dominates a UI surface. It signals: "this is machine output for human forwarding" — deliberately different from everything else in the system.

## 6. Do's and Don'ts

### Do:
- **Do** use tonal layering (Foundation to Surface to Elevated) to communicate containment and depth. These three steps are the entire elevation system.
- **Do** use `border-radius: 9999px` (rounded-full) exclusively for interactive pill elements: buttons and badges. All containers use md (6px) or xl (12px) radius.
- **Do** use IBM Plex Mono for all machine-generated strings: submission IDs, resource group names, ARM deployment tags, and proof artifact content.
- **Do** write Label-level text in uppercase with 0.075em letter-spacing. Reserve it for genuine taxonomy (category names, section meta). Never use it for general emphasis.
- **Do** keep body copy under 65 characters per line to support comfortable reading in wizard flows.
- **Do** use semantic badge colors (success, warning, error) to communicate deployment status. Each is a 15% opacity background with full-opacity text.
- **Do** animate with ease-out exponential curves (`cubic-bezier(0.22, 1, 0.36, 1)`). State transitions are 150ms. Page entry animations are 420ms.
- **Do** scope shadows to floating UI only: modals (`shadow-2xl`) and toasts (`shadow-lg`). Never on cards or sections.

### Don't:
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe on cards, list items, or callouts. Rewrite with a background tint or full border.
- **Don't** use `background-clip: text` with a gradient. All text is a single solid color. Emphasis lives in weight and scale, not gradient fills.
- **Don't** use glassmorphism decoratively. `backdrop-blur` appears only on the scrolled navbar and is structural — it prevents visual bleed, not aesthetic effect.
- **Don't** invent a fourth surface layer. Foundation, Surface, and Elevated are the complete tonal vocabulary. A deeper nesting is a design error.
- **Don't** apply box-shadows to cards, section containers, or nav elements. Shadows belong only to elements that float above the page.
- **Don't** use sharp corners or fully square buttons. The pill shape is the deliberate affordance signal for interactive elements.
- **Don't** use IBM Plex Mono for UI copy, headings, or labels. It belongs to machine-generated output only.
- **Don't** build screens that feel like a boxy SharePoint intranet — low information density, generic corporate blue, form energy from 2012.
- **Don't** build screens that feel like AWS Console — overwhelming options, dense navigation, everything surfaced at once. This tool exists to abstract that complexity away.
- **Don't** use flashy SaaS marketing patterns: gradient fills, glassmorphism cards, hero metrics (big number + small label + gradient accent), or decorative animation. These are performative and erode trust.
- **Don't** use neon accents, cyberpunk color treatments, or glowing dark-mode aesthetics. The palette is structured, muted, and government-adjacent enterprise.
- **Don't** build identical card grids: same-sized cards with icon + heading + body text, repeated endlessly. Cards are a lazy answer; use them only when they're the best affordance.
