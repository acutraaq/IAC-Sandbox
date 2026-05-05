---
name: phase-core
description: Foundation + Domain phases (1-2): CSS tokens, layout shell, UI primitives, types, store, and utilities for IAC Sandbox
archived: true
archived_date: 2026-05-02
reason: All phases complete and shipped. Archived to prevent accidental re-execution.
---

# Phase: Core Foundation + Domain (Phases 1–2)

## Overview
Implements the complete foundation layer that all other phases depend on: design tokens, layout shell, UI primitives, TypeScript types, Zustand store, and utility functions. Do not start any other phase until this passes all three quality gates (`lint`, `npx vitest run`, `build`).

## Scope — Files to Create or Modify

### Phase 1: Foundation
- `web/app/globals.css` — CSS variable design tokens (dark + light themes per CLAUDE.md §Design System)
- `web/app/layout.tsx` — RootLayout with PageShell
- `web/components/layout/PageShell.tsx` — main page wrapper
- `web/components/layout/Navbar.tsx` — minimal floating nav, logo left, theme toggle right
- `web/components/layout/ThemeToggle.tsx` — reads/writes `localStorage` key `sandbox-theme`, applies `data-theme` attribute to `<html>`
- `web/components/ui/Button.tsx` — pill-style, variants: primary/secondary/ghost
- `web/components/ui/Card.tsx` — `rounded-xl`, border, hover lift shadow
- `web/components/ui/Badge.tsx` — small label, variants: default/success/warning/error
- `web/components/ui/Modal.tsx` — `role="dialog"`, `aria-modal`, Escape to close, focus trap
- `web/components/ui/Toast.tsx` — success/error variants, auto-dismiss

### Phase 2: Domain
- `web/types/index.ts` — all shared TypeScript types (no `any`)
- `web/data/templates.json` — 16 Azure deployment templates across 6 categories
- `web/data/resources.json` — Azure resource types (used by Custom Builder + Request pages)
- `web/store/deploymentStore.ts` — Zustand store; modes: `"template"`, `"custom"`, `"custom-request"`; actions include `resetCustomRequest()`
- `web/lib/schema.ts` — `buildSchema(fields: FieldSchema[]): ZodObject`
- `web/lib/icons.ts` — `getIcon(name: string): LucideIcon`
- `web/lib/display.ts` — `displayFieldValue(field, value)` for rendering form values
- `web/lib/api.ts` — `submitDeployment(payload): Promise<SubmitResponse>` — POSTs to `/api/deployments`
- `web/lib/report.ts` — `generateReport(submissionId, store): string`

## Acceptance Criteria

### Foundation done when:
- CSS tokens match CLAUDE.md §Design System table for both dark and light themes
- Theme toggle switches theme and persists across page reload
- Navbar renders on all pages with logo and toggle
- Button, Card, Badge, Modal, Toast all render with correct ARIA (`role="dialog"` on Modal, `aria-label` on interactive elements)
- Reduced-motion: all Framer Motion animations respect `prefers-reduced-motion`

### Domain done when:
- All types in `types/index.ts` — no `any`, strict TypeScript
- `buildSchema` accepts `FieldSchema[]` and returns a Zod schema object
- `getIcon` returns a LucideIcon component; throws or returns null for unknown names
- `submitDeployment` POSTs to `/api/deployments` (same-origin — no `NEXT_PUBLIC_API_URL` env var) and returns `SubmitResponse`
- `generateReport` returns exactly the proof artifact format from CLAUDE.md §Proof Artifact Format
- Store initialises with empty state; modes and actions work correctly

## Quality Gates

Run from `web/` before declaring this phase done:

```bash
cd web
npm run lint       # 0 errors
npx vitest run     # all pass
npm run build      # .next/standalone/ produced (NOT /out — output is standalone, not static export)
```

## Reference
- Design tokens: CLAUDE.md §Design System
- Proof artifact format: CLAUDE.md §Proof Artifact Format
- API contract: `docs/project/API_SPEC_OPENAPI.yaml`
- Data model: `docs/project/SPEC.md` §9
