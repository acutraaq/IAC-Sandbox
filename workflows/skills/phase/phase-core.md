---
name: phase-core
description: Foundation + Domain phases (1-2): CSS tokens, layout shell, UI primitives, types, store, and utilities for IAC Sandbox
---

# Phase: Core Foundation + Domain (Phases 1–2)

You are implementing the foundation and domain layer of IAC Sandbox. Every other phase depends on this being correct.

## Scope — Files to Create or Modify

### Phase 1: Foundation
- `frontend/app/globals.css` — CSS variable design tokens (dark + light themes per CLAUDE.md §Design System)
- `frontend/app/layout.tsx` — RootLayout with PageShell
- `frontend/components/layout/PageShell.tsx` — main page wrapper
- `frontend/components/layout/Nav.tsx` — minimal floating nav, logo left, theme toggle right
- `frontend/components/layout/ThemeToggle.tsx` — reads/writes `localStorage` key `sandbox-theme`, applies `data-theme` attribute to `<html>`
- `frontend/components/ui/Button.tsx` — pill-style, variants: primary/secondary/ghost
- `frontend/components/ui/Card.tsx` — `rounded-xl`, border, hover lift shadow
- `frontend/components/ui/Badge.tsx` — small label, variants: default/success/warning/error
- `frontend/components/ui/Modal.tsx` — `role="dialog"`, `aria-modal`, Escape to close, focus trap
- `frontend/components/ui/Toast.tsx` — success/error variants, auto-dismiss

### Phase 2: Domain
- `frontend/types/index.ts` — all shared TypeScript types (no `any`)
- `frontend/data/templates.json` — 8 Azure deployment templates
- `frontend/data/resources.json` — 8 Azure resource types
- `frontend/store/deploymentStore.ts` — Zustand store with set/clear actions
- `frontend/lib/schema.ts` — `buildSchema(fields: FieldSchema[]): ZodObject`
- `frontend/lib/icons.ts` — `getIcon(name: string): LucideIcon`
- `frontend/lib/api.ts` — `submitDeployment(payload: DeploymentPayload): Promise<SubmitResponse>`
- `frontend/lib/report.ts` — `generateReport(submissionId: string, store: DeploymentStore): string`

## Acceptance Criteria

### Foundation done when:
- CSS tokens match CLAUDE.md §Design System table for both dark and light themes
- Theme toggle switches theme and persists across page reload
- Nav renders on all pages with logo and toggle
- Button, Card, Badge, Modal, Toast all render with correct ARIA (`role="dialog"` on Modal, `aria-label` on interactive elements)
- Reduced-motion: all Framer Motion animations respect `prefers-reduced-motion`

### Domain done when:
- All types in `types/index.ts` — no `any`, strict TypeScript
- `buildSchema` accepts `FieldSchema[]` and returns a Zod schema object
- `getIcon` returns a LucideIcon component; throws or returns null for unknown names
- `submitDeployment` POSTs to `${process.env.NEXT_PUBLIC_API_URL}/deployments` and returns `SubmitResponse`
- `generateReport` returns exactly the proof artifact format from CLAUDE.md §Proof Artifact Format
- Store initialises with empty state; actions: `setTemplatePayload`, `setCustomPayload`, `setUser`, `clearStore`

## Quality Gates

Run from `frontend/` before declaring this phase done:

```
npm run lint       # 0 errors
npm run test:run   # all pass
npm run build      # /out produced
```

## Reference
- Design tokens: CLAUDE.md §Design System
- Proof artifact format: CLAUDE.md §Proof Artifact Format
- API contract: `implementation/API_SPEC_OPENAPI.yaml`
- Data model: SPEC.md §9
