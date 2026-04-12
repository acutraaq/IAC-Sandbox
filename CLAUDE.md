# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Sandbox Playground** is an Azure Infrastructure-as-Code deployment platform. It lets non-expert users configure and submit Azure infrastructure deployments through two guided flows:

- **Template Flow** — Multi-step wizard using predefined templates
- **Custom Builder Flow** — Resource-by-resource configuration builder

Both flows converge at a shared Review & Submit page, calling `POST /deployments` on the backend. After submission, a copyable plain-text proof artifact is generated for manual HOD approval.

**Microsoft SSO (Entra ID)** is mandatory for all deployment actions (ADR-002). Authentication is deferred alongside backend implementation but is a core requirement — not optional.

> All design decisions, requirements, and architecture are in `implementation/SPEC.md`. The API contract is in `implementation/API_SPEC_OPENAPI.yaml`. Read these before making changes.

---

## Key Documentation

| File | Purpose |
|------|---------|
| `implementation/SPEC.md` | Complete specification — requirements, architecture, ADRs, backlogs, agent model, delivery plan |
| `implementation/API_SPEC_OPENAPI.yaml` | Frozen OpenAPI 3.1.0 contract — do not modify without an ADR (see SPEC.md Section 14) |

---

## Agents & Skills

All Claude Code sub-agents and project skills are defined in `workflows/` and installed via:

```bash
./scripts/install-workflows.sh
```

| Where | Contents |
|-------|----------|
| `workflows/agents/` | 8 sub-agent definitions (A1–A8) matching SPEC.md §17 |
| `workflows/skills/phase/` | Phase reference cards: `phase-core`, `phase-templates`, `phase-builder-review`, `phase-qa` |
| `workflows/skills/commands/` | Dev commands: `dev`, `test`, `lint`, `build`, `smoke` |
| `workflows/README.md` | Full agent + skill index with invocation instructions |

Run the install script after cloning or after editing any file in `workflows/`.

---

## Tech Stack

### Frontend (`frontend/`)
- **Framework:** Next.js 16 — App Router, static export (`output: 'export'`)
- **Language:** TypeScript (strict mode — no `any`)
- **Styling:** Tailwind CSS v4 with CSS variable design tokens
- **State:** Zustand — single `deploymentStore` for all cross-route state
- **Forms:** React Hook Form + Zod (`buildSchema` utility in `lib/schema.ts`)
- **Icons:** Lucide React (`getIcon` utility in `lib/icons.ts`)
- **Animations:** Framer Motion (reduced-motion safe)
- **Testing:** Vitest + React Testing Library
- **API Mocking:** MSW (Mock Service Worker) for `POST /deployments` during frontend-only development

### Backend (`backend/`) — deferred
- Node.js 22 LTS, Fastify, TypeScript, Zod, Prisma, PostgreSQL 16

### Infrastructure (`infra/`) — deferred
- Azure Bicep (resource-group scope), Azure Container Apps, Azure Key Vault, Managed Identity

---

## Directory Layout

```
/
├── frontend/               # Next.js 16 app (active development)
│   ├── app/                # App Router pages and layouts
│   │   ├── globals.css     # CSS variable design tokens (dark + light)
│   │   ├── layout.tsx      # RootLayout
│   │   ├── page.tsx        # Home (/)
│   │   ├── login/          # /login (SSO entry — deferred)
│   │   ├── templates/      # /templates and /templates/[slug]
│   │   ├── builder/        # /builder
│   │   └── review/         # /review
│   ├── components/
│   │   ├── layout/         # PageShell, Nav, ThemeToggle
│   │   ├── ui/             # Button, Card, Badge, Modal, Toast
│   │   ├── templates/      # TemplateGrid, FilterPills, TemplateCard
│   │   ├── wizard/         # Stepper, WizardStep, SummaryPanel
│   │   ├── builder/        # ResourceCatalog, ResourceDrawer, SelectedPanel
│   │   └── review/         # ReviewSection, SubmitButton, ConfirmModal
│   ├── store/
│   │   └── deploymentStore.ts
│   ├── lib/
│   │   ├── schema.ts       # buildSchema(fields: FieldSchema[]) → ZodObject
│   │   ├── icons.ts        # getIcon(name: string) → LucideIcon
│   │   ├── api.ts          # submitDeployment(payload) → SubmitResponse
│   │   └── report.ts       # generateReport(submissionId, store) → string
│   ├── types/
│   │   └── index.ts        # All shared TypeScript types
│   ├── data/
│   │   ├── templates.json  # 8 Azure deployment templates
│   │   └── resources.json  # 8 Azure resource types
│   ├── mocks/              # MSW handlers for API mocking
│   │   └── handlers.ts
│   └── __tests__/          # Co-located preferred, fallback here
│       ├── store/
│       ├── lib/
│       └── components/
│
├── backend/                # Fastify API — deferred
├── infra/                  # Azure Bicep — deferred
└── implementation/         # Frozen specs (READ-ONLY)
    ├── SPEC.md
    └── API_SPEC_OPENAPI.yaml
```

---

## Development Commands

```sh
# Run from frontend/
npm run dev          # Start dev server (localhost:3000)
npm run build        # Static export to /out
npm run lint         # ESLint — must pass with 0 errors
npm run test:run     # Vitest — must all pass

# Run a single test file
npx vitest run path/to/Component.test.tsx
# Run tests matching a name pattern
npx vitest run -t "should prevent duplicate resources"
```

---

## Design System

Design inspired by premium web aesthetics from godly.website (dark-first, editorial):

### Color Tokens (Dark Theme — default)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0a0a0a` | Page background |
| `--color-surface` | `#111111` | Card backgrounds |
| `--color-surface-elevated` | `#1a1a1a` | Modals, drawers, elevated cards |
| `--color-border` | `rgba(255,255,255,0.08)` | Subtle card/section borders |
| `--color-text` | `#f0f0f0` | Primary text |
| `--color-text-muted` | `rgba(255,255,255,0.5)` | Secondary/helper text |
| `--color-accent` | `#0078d4` | Azure blue — icons, highlights, primary CTAs |
| `--color-accent-hover` | `#1a8fe8` | Hover state for accent CTAs |
| `--color-error` | `#ef4444` | Validation errors, error toasts |
| `--color-success` | `#22c55e` | Success toasts, completion states |
| `--color-warning` | `#f59e0b` | Warning badges, caution states |

### Color Tokens (Light Theme — `html[data-theme='light']`)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#fafafa` | Page background |
| `--color-surface` | `#ffffff` | Card backgrounds |
| `--color-surface-elevated` | `#ffffff` | Modals, drawers |
| `--color-border` | `rgba(0,0,0,0.08)` | Borders |
| `--color-text` | `#171717` | Primary text |
| `--color-text-muted` | `rgba(0,0,0,0.5)` | Secondary text |
| `--color-accent` | `#0078d4` | Same Azure blue |
| `--color-accent-hover` | `#005a9e` | Darker on hover |
| `--color-error` | `#dc2626` | Validation errors |
| `--color-success` | `#16a34a` | Success states |
| `--color-warning` | `#d97706` | Warning states |

### Visual Direction
- Dark-first; light theme toggled via `html[data-theme='light']`
- Theme persisted to `localStorage` under key `sandbox-theme`
- Font: Geist Sans (headings + body), large bold headings (4xl–6xl), generous whitespace
- Cards: `rounded-xl`, soft border, hover lift shadow
- CTAs: high-contrast pill buttons, white on dark, accent on hover
- Navigation: minimal floating nav, logo left, theme toggle right
- Animations: subtle entrance transitions, drawer slide-in, all reduced-motion safe

---

## Proof Artifact Format

The confirmation modal generates a copyable plain-text report. This format is compliance-critical (ADR-008):

```
SANDBOX DEPLOYMENT PROOF
========================
Submission ID : <submissionId>
Submitted By  : <name> (<email>)
Tenant        : <tenantId>
Date/Time     : <locale-formatted, en-MY>
Mode          : Template | Custom
Target Sub    : <subscription>
Target RG     : <resource-group>
Status        : accepted | running | succeeded | failed

Selection:
- Template: <slug/name>
  Form Values:
    <key>: <value>
or
- Resource 1: <type> — <name>
  Config: <key>: <value>

Note: Manual HOD approval is required outside this system.
```

---

## Error Response Contract

The backend returns errors in this standard format (ADR-007). Frontend `lib/api.ts` must parse this:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "path": "template.slug", "message": "Required" }
    ]
  },
  "requestId": "req_abc123"
}
```

During frontend-only development, MSW handlers should return this same shape for error scenarios.

---

## Coding Conventions

- **TypeScript strict mode** — no `any`, no type assertions without justification
- **API contract is frozen** — do not edit `implementation/API_SPEC_OPENAPI.yaml` without creating an ADR in `implementation/SPEC.md` Section 14
- **Validate all input with Zod** — use `buildSchema` for dynamic field validation
- **State via Zustand only** — no component-local state for data that crosses routes
- **No raw SQL** — Prisma only (when backend is built)
- **Structured JSON logs** — include `requestId`, `submissionId` fields (backend)
- **No secrets in code or logs** — use env vars / Azure Key Vault
- **Accessibility built-in** — every component must include ARIA labels, `role=dialog` for overlays, `aria-invalid` for errors, keyboard support (Escape closes modals, Enter/Space activates cards). Do not bolt on a11y as an afterthought.
- **Tests co-located when practical** — prefer `Component.test.tsx` next to `Component.tsx`. Use `__tests__/` for store/lib tests.

---

## Git and Branch Strategy

### Branch Model
- `main` — production-ready only
- `develop` — integration branch
- Feature branches per agent/workstream: `feat/<scope>`, `chore/<scope>`, `docs/<scope>`
- One active branch per workstream, rebase from `develop` daily

### Commit Messages
Use conventional commits:
```
feat: add template catalog with category filtering
fix: prevent duplicate resource types in builder
chore: configure ESLint and Vitest
docs: update SPEC.md with ADR-016
```

### Merge Rules
- Required reviewers approved
- CI checks green (lint/test/build)
- No contract-breaking changes without updating SPEC.md
- See SPEC.md Section 18 for full PR order and dependencies

---

## Quality Gates

All of these must pass before any phase is considered complete:

```sh
npm run lint         # 0 errors
npm run test:run     # All tests pass
npm run build        # /out directory produced (static export)
```

Additional manual checks:
- Both flows (template + custom) work end-to-end
- Theme toggle persists across page loads
- Keyboard navigation works in modals and drawers
- No console errors in happy paths

---

## Environment Variables

### Frontend
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API base URL |

### Backend (deferred — for reference)
| Variable | Description |
|----------|-------------|
| `PORT` | Server port |
| `NODE_ENV` | Runtime environment |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) |
| `LOG_LEVEL` | Logging verbosity |
| `BODY_LIMIT_BYTES` | Max request body size |
| `ENABLE_GET_DEPLOYMENT` | Feature flag for `GET /deployments/:id` |

---

## NPM Dependencies (Frontend)

### Production
- `next` (v16), `react`, `react-dom` (v19)
- `zustand` — state management
- `react-hook-form`, `@hookform/resolvers` — forms
- `zod` — validation
- `lucide-react` — icons
- `framer-motion` — animations

### Development
- `typescript`, `@types/react`, `@types/react-dom`
- `tailwindcss` (v4)
- `eslint`, `eslint-config-next`
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
- `msw` — API mocking during frontend-only development

---

## Build Order

**Frontend first. Do not touch `backend/` or `infra/` until all frontend phases pass quality gates.**

| Phase | What |
|-------|------|
| 1 | Foundation — scaffold, tooling, CSS tokens, layout, UI primitives (with a11y built in) |
| 2 | Domain layer — types, data JSON, store, utilities |
| 3a | Home page — hero, CTAs, ambient visuals |
| 3b | Template flow — catalog, wizard, stepper, summary panel |
| 3c | Custom builder — catalog, drawer, selected panel |
| 3d | Review + Submit — guard, payload, API client, confirmation modal, proof report |
| 4 | Quality — tests, lint, build verification, smoke test |
| — | Backend (deferred) |
| — | Infrastructure/Bicep (deferred) |
