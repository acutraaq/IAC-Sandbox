# IAC Sandbox — UI/UX Redesign Design Spec

**Date:** 2026-04-23
**Status:** Approved
**Scope:** Full visual redesign + document reorganization

---

## Overview

A full UI/UX overhaul of the IAC Sandbox web app to match a professional GLC (Government-Linked Company) standard with a technical edge. The redesign standardises typography, colour, spacing, and navigation while adding polish features and expanding the template library.

---

## 1. Navigation

### Decision: Single top navbar

Remove all existing navigation components (`Nav.tsx`, `Sidebar.tsx`, `Topbar.tsx`, `PageShell.tsx`) and replace with a single unified `Navbar.tsx`.

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  [⊞] Sandbox    Home   Templates              [☀]  [SB]   │
└────────────────────────────────────────────────────────────┘
```

**Specs:**
- Height: `64px`
- Background: `bg-surface` with `border-b border-border`
- Backdrop blur on scroll: `backdrop-blur-md bg-surface/90`
- Logo: grid square SVG (see Section 3) + "Sandbox" in IBM Plex Sans 600
- Nav links: `Home`, `Templates` — active state: deep navy underline indicator
- Theme toggle: sun/moon icon, right side
- User avatar: static initials "SB" in a `32×32px` circle, right of toggle
- Mobile: hamburger menu collapses nav links

**Removed:**
- `components/layout/Sidebar.tsx` — deleted
- `components/layout/Nav.tsx` — deleted
- `components/layout/Topbar.tsx` — deleted
- `components/layout/PageShell.tsx` — replaced with simple `<main>` wrapper
- Settings button — deleted entirely (no functionality exists)
- `app/login/page.tsx` — deleted (MSAL blocked on admin credentials; dead page)

### Breadcrumb trail

Add `components/layout/Breadcrumb.tsx` — shown on all pages except Home.

Examples:
- Templates page: `Home / Templates`
- Template detail: `Home / Templates / Web Application`
- Builder: `Home / Builder`
- My Stuff: `Home / My Deployments`
- Review: `Home / Review`

Uses `text-muted` separators, current page in `text-primary` (not linked).

---

## 2. Colour System

### Philosophy

Soft blue-gray palette. Not pure white, not dark. Professional GLC institutional feel with a technical character. Light mode is the default; dark mode is available via toggle.

### Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--color-bg` | `#edf1f7` | `#1a2535` |
| `--color-surface` | `#f8fafd` | `#243044` |
| `--color-surface-elevated` | `#ffffff` | `#2e3d58` |
| `--color-border` | `#d4dce8` | `rgba(44,127,212,0.18)` |
| `--color-border-strong` | `#b0c0d8` | `rgba(44,127,212,0.35)` |
| `--color-text` | `#1e3148` | `#d8e4f0` |
| `--color-text-muted` | `#5a7290` | `rgba(160,190,225,0.75)` |
| `--color-primary` | `#1e3a5f` | `#2b7fd4` |
| `--color-primary-hover` | `#163050` | `#3a8ee3` |
| `--color-accent` | `#2b7fd4` | `#4a9be0` |
| `--color-error` | `#c0392b` | `#ef4444` |
| `--color-success` | `#2e7d52` | `#22c55e` |
| `--color-warning` | `#9a6110` | `#f59e0b` |

**Rules:**
- No raw hex values in any component — semantic tokens only
- Remove all inline Tailwind palette classes (`text-red-400`, `text-green-400`, `text-yellow-400` etc.) — replace with `text-error`, `text-success`, `text-warning`
- Background grid pattern retained but opacity reduced to `0.03` for softness

---

## 3. Logo

Custom SVG component: `components/ui/Logo.tsx`

**Design:** Rounded square border (`rx=4`) with a 3×3 grid of 9 small filled circles, evenly spaced. Azure blue (`--color-accent`) stroke and fill.

**Sizes:**
- `size="sm"` — 20×20px (favicon, nav)
- `size="md"` — 32×32px (default nav usage)
- `size="lg"` — 48×48px (hero/display)

Replaces the current Lucide `Box` icon with rotation animation. No animation on the logo — static, clean.

---

## 4. Typography

### Font stack

Replace Geist Sans + Geist Mono with IBM Plex Sans + IBM Plex Mono.

**Import method:** `next/font/google`

```typescript
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

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
```

Update `app/layout.tsx` and `globals.css` font variables accordingly.

### Type scale

| Name | Size | Weight | Usage |
|------|------|--------|-------|
| Display | 48px | 700 | Hero headlines |
| H1 | 32px | 700 | Page titles |
| H2 | 24px | 600 | Section headings |
| H3 | 18px | 600 | Card headings |
| Body | 16px | 400 | Default text |
| Small | 14px | 400 | Secondary text, labels |
| Micro | 12px | 500 | Badges, tags, captions |
| Mono | 14px | 400 | Resource names, IDs, codes |

**Rules:**
- Line height: `1.5` throughout
- No mixed weights within the same hierarchy level across pages
- Letter spacing: default (no tight tracking on body)

---

## 5. Spacing

Strict 4px base unit. All padding, margin, and gap values must be multiples of 4.

**Allowed values:** `4 8 12 16 20 24 32 40 48 64px`

No arbitrary Tailwind values (e.g. `p-5` next to `p-6` on same component type).

**Page max-widths:**
- Home, Templates: `max-w-7xl`
- My Stuff, Review: `max-w-3xl`
- Builder: `max-w-7xl`

Horizontal page padding: `px-6` (mobile) → `px-8` (md+)

---

## 6. Page Designs

### Home

Two zones:

**Zone 1 — Welcome header:**
- Title: "Sandbox" (H1)
- Subtitle: "Deploy Azure resources in minutes." (Body, muted)
- Two CTA buttons: `Browse Templates` (primary) and `Build Custom` (secondary)

**Zone 2 — Popular Templates:**
- Section label: "Popular Templates" (H3, muted)
- 4 template cards in a responsive grid (2 cols mobile, 4 cols desktop)
- "View all templates →" link

**Zone 3 — My Recent Deployments:**
- Section label: "My Recent Deployments" (H3, muted)
- Last 5 deployments as slim list rows with status dot, RG name, location, date
- Skeleton loading state (3 placeholder rows)
- Empty state: "No deployments yet. Start with a template."
- "View all →" link to My Stuff

Remove: `HeroSection.tsx`, `FeaturesSection.tsx`, `GetStartedSection.tsx` — replaced by the simpler dashboard layout above.

### Templates page

Two sections:

**Section 1 — Scenario Bundles** (new):
Header: "Scenario Bundles" with subtitle "Pre-built multi-resource configurations for common workloads."
4 new bundle cards in a 2×2 grid (desktop), 1-col (mobile).

**Section 2 — Individual Resources** (existing):
Header: "Individual Resources"
Existing template cards with category filter pills.

Filter pills apply to Section 2 only (bundles are always shown).

### Builder page

Visual reskin only — no structural changes. Apply new colour tokens, typography, and spacing.

### My Stuff (My Deployments)

- Page title updated: "My Deployments" (H1) — clearer than "My Stuff"
- Nav link label stays "My Stuff" for familiarity
- Status colours use semantic tokens (remove `text-green-400`, `text-red-400`, `text-yellow-400`)
- Cards: `p-5` → `p-6`, gap `gap-3` → `gap-4`
- Skeleton loading: 3 placeholder card rows while fetching

### Review page

- Tag input fields: `h-11` minimum (touch-friendly)
- Visible `<label>` elements above each input (currently using placeholder-only)
- Error messages below each field (already implemented — retain)
- Submit button: shows spinner + "Submitting…" text during async operation
- Deployment confirmation modal: see Section 7 (Status Timeline)

---

## 7. Nice-to-Have Features

### 7.1 Deployment status timeline

Replace the plain status text in `ConfirmModal.tsx` with a 4-step visual timeline:

```
● Queued  —  ● Provisioning  —  ● Deploying  —  ○ Complete
```

Steps:
1. **Queued** — message enqueued (immediate on submit)
2. **Provisioning** — ARM status is `accepted` or `running`, RG being created
3. **Deploying** — ARM status is `running`, resources deploying
4. **Complete** — ARM status is `succeeded` or `failed`

Each step: filled circle (completed/active) vs empty circle (pending). Active step pulses with a subtle `animate-pulse`. Failed state turns the active step red.

### 7.2 Skeleton loading screens

Replace all `<Loader2 className="animate-spin" />` spinners with skeleton screens:

- **Home recent deployments:** 3 rows of `h-16 rounded-xl bg-border animate-pulse`
- **My Deployments page:** 3 card skeletons matching the card layout shape
- **Templates page:** 4 card skeletons in grid layout

Skeletons respect `prefers-reduced-motion` (disable pulse animation).

### 7.3 Breadcrumb trail

See Section 1. `Breadcrumb.tsx` component accepts `items: { label: string; href?: string }[]`.

### 7.4 Policy tooltip on blocked Builder resources

In `ResourceCatalog.tsx`, instead of hiding `policyBlocked` resources entirely, show them as:
- Grayed out card (`opacity-50`)
- Lock icon overlay
- Tooltip on hover: `"Not permitted by COE-Allowed-Resources policy"`

This helps users understand why resources are unavailable rather than wondering if they're missing.

### 7.5 Smooth page fade transitions

Wrap page content in a `PageTransition.tsx` client component that applies:

```css
@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

Duration: `150ms`, easing: `ease-out`. Respects `prefers-reduced-motion`.

### 7.6 Footer

Add `components/layout/Footer.tsx` — slim `48px` footer at the bottom of every page:

```
Sandbox Cloud Automation   ·   v1.0.0   ·   Sandbox Environment
```

Text in `text-muted`, `text-xs`. Separated from content by `border-t border-border`.

---

## 8. New Templates

All resources in new templates are validated against `POLICY_ALLOWED_RESOURCE_TYPES` in `functions/src/modules/deployments/arm-template-builder.ts`.

### Full-Stack Web App
**Resources:** App Service Plan + App Service + Azure SQL Server + Azure SQL Database + Storage Account + Key Vault
**Category:** `compute`
**Icon:** `Layers`
**Estimated time:** `~8 minutes`
**Wizard steps:** App details → Database settings → Storage → Security → Review

### Microservices Platform
**Resources:** Container App Environment + Container App + Service Bus Namespace + Managed Identity
**Category:** `compute`
**Icon:** `Network`
**Estimated time:** `~6 minutes`
**Wizard steps:** App details → Messaging → Identity → Review

### Data Pipeline
**Resources:** Storage Account + Azure Functions (Consumption) + Azure SQL Server + Azure SQL Database
**Category:** `data`
**Icon:** `GitMerge`
**Estimated time:** `~6 minutes`
**Wizard steps:** Pipeline name → Storage → Database → Review

### Secure API Backend
**Resources:** App Service Plan + App Service + Key Vault + API Management + Log Analytics Workspace
**Category:** `compute`
**Icon:** `ShieldCheck`
**Estimated time:** `~10 minutes`
**Wizard steps:** API details → Security → Observability → Review

All 4 templates added to `web/data/templates.json` with `policyBlocked: false`. Existing 9 templates reviewed for accuracy of descriptions and resource counts.

---

## 9. Document Reorganisation

### New structure

```
docs/
  project/                    ← permanent project reference
    SPEC.md                   ← moved from /implementation/SPEC.md
    API_SPEC_OPENAPI.yaml     ← moved from /implementation/API_SPEC_OPENAPI.yaml
  superpowers/
    specs/                    ← active design specs only
      2026-04-23-refactor-cleanup-design.md
      2026-04-23-ui-redesign-design.md    ← this file
    plans/                    ← active plans only (empty until implementation begins)
    archive/
      specs/                  ← completed/superseded specs
        2026-04-12-workflows-design.md
        2026-04-22-ci-cleanup-design.md
      plans/                  ← completed plans
        2026-04-12-workflows-implementation.md
        2026-04-22-ci-cleanup.md
        2026-04-22-deployment-fix.md
        2026-04-22-drop-db-arm-tracking.md
```

### Actions

- Move `implementation/SPEC.md` → `docs/project/SPEC.md`
- Move `implementation/API_SPEC_OPENAPI.yaml` → `docs/project/API_SPEC_OPENAPI.yaml`
- Delete empty `implementation/` folder
- Move 4 completed plans to `docs/superpowers/archive/plans/`
- Move 2 old specs to `docs/superpowers/archive/specs/`
- Update `CLAUDE.md` reference to SPEC.md (new path)
- `workflows/` — no changes (source of truth for Claude agents/skills)

---

## 10. File Change Summary

| Area | Files |
|------|-------|
| **Delete** | `components/layout/Sidebar.tsx`, `Nav.tsx`, `Topbar.tsx`, `PageShell.tsx` |
| **Delete** | `components/home/HeroSection.tsx`, `FeaturesSection.tsx`, `GetStartedSection.tsx` |
| **Delete** | `app/login/page.tsx` |
| **New** | `components/layout/Navbar.tsx`, `Breadcrumb.tsx`, `Footer.tsx`, `PageTransition.tsx` |
| **New** | `components/ui/Logo.tsx` |
| **Modify** | `app/layout.tsx` — IBM Plex Sans/Mono, new shell |
| **Modify** | `app/globals.css` — new colour tokens, font variables |
| **Modify** | `app/page.tsx` — new dashboard layout |
| **Modify** | `app/my-stuff/page.tsx` — semantic tokens, skeleton, updated title |
| **Modify** | `app/review/page.tsx` — polished form labels, submit state |
| **Modify** | `app/templates/page.tsx` — Scenario Bundles section + Individual Resources |
| **Modify** | `components/review/ConfirmModal.tsx` — status timeline |
| **Modify** | `components/builder/ResourceCatalog.tsx` — policy tooltip |
| **Modify** | `web/data/templates.json` — 4 new templates + existing template review |
| **Modify** | `components/ui/Button.tsx`, `Card.tsx`, `Badge.tsx` — new token classes |
| **Docs** | Move + archive as per Section 9 |

---

## 11. Out of Scope

- Authentication / MSAL SSO (blocked on admin credentials)
- My Stuff page accessible from top nav (reachable via Home dashboard "View all →" link)
- Builder page nav link (reachable via "Build Custom" CTA on Home)
- Copy button on resource IDs (deferred)
- Tag auto-fill from last deployment (deferred)
