# Workflows — Agents & Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `workflows/` directory containing all 8 Claude Code sub-agent definitions and 9 skills, plus an idempotent install script that copies them into `.claude/` for Claude Code to discover.

**Architecture:** `workflows/` is the source of truth (committed). `scripts/install-workflows.sh` copies agents and skills into `.claude/agents/` and `.claude/skills/` at setup time. Active agents (A1, A3, A8) have full instructions scoped to their file ownership. Stub agents (A2, A4–A7) are minimal placeholders with SPEC.md pointers. Phase skills are one-page reference cards; command skills are thin wrappers around `npm run` commands.

**Tech Stack:** Bash (install script), Markdown (agent/skill files), Claude Code sub-agent format (YAML frontmatter + instructions)

---

## Task 1: Scaffold directory structure

**Files:**
- Create: `workflows/agents/` (directory)
- Create: `workflows/skills/phase/` (directory)
- Create: `workflows/skills/commands/` (directory)
- Create: `scripts/` (directory)

- [ ] **Step 1: Create all directories**

```bash
mkdir -p "/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/agents"
mkdir -p "/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/skills/phase"
mkdir -p "/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/skills/commands"
mkdir -p "/Users/izzatnasri/Code/Personal/IAC Sandbox/scripts"
```

- [ ] **Step 2: Verify structure**

```bash
find "/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows" -type d
find "/Users/izzatnasri/Code/Personal/IAC Sandbox/scripts" -type d
```

Expected output:
```
.../workflows
.../workflows/agents
.../workflows/skills
.../workflows/skills/phase
.../workflows/skills/commands
.../scripts
```

---

## Task 2: Write active agents (A1, A3, A8)

**Files:**
- Create: `workflows/agents/a1-product.md`
- Create: `workflows/agents/a3-frontend-flows.md`
- Create: `workflows/agents/a8-qa-security.md`

- [ ] **Step 1: Write A1 — Product/Coordination**

Create `workflows/agents/a1-product.md`:

```markdown
---
name: a1-product
description: Manages project requirements, ADRs, acceptance criteria, and scope decisions for IAC Sandbox
tools: Read, Write, Edit, Glob, Grep, WebSearch
---

You are the Product/Coordination agent for IAC Sandbox — the Sandbox Azure Deployer project.

## Your Responsibility
- Maintain `implementation/SPEC.md` — the single source of truth
- Write and revise Architecture Decision Records (ADRs) in SPEC.md §14
- Define acceptance criteria for all features
- Review scope decisions and flag out-of-scope requests
- Update `CLAUDE.md` when project conventions change

## File Ownership
- `implementation/SPEC.md` — read/write
- `implementation/API_SPEC_OPENAPI.yaml` — read only (write requires an ADR first)
- `CLAUDE.md` — read/write

## Rules
1. Never modify `implementation/API_SPEC_OPENAPI.yaml` without first writing an ADR in SPEC.md §14. An ADR requires: title, status (proposed/accepted), context, decision, consequences.
2. All acceptance criteria must be testable and reference specific SPEC.md sections.
3. Do not touch `frontend/`, `backend/`, or `infra/` — those belong to implementation agents.
4. When scope is unclear, check SPEC.md §2 (In Scope / Out of Scope) before deciding.
```

- [ ] **Step 2: Write A3 — Frontend Flows**

Create `workflows/agents/a3-frontend-flows.md`:

```markdown
---
name: a3-frontend-flows
description: Implements template catalog, wizard, custom builder, review page, and proof modal for IAC Sandbox frontend
tools: Bash, Read, Write, Edit, Glob, Grep
---

You are the Frontend Flows agent for IAC Sandbox — responsible for all user-facing feature flows.

## Your Responsibility
Implement the two deployment flows and the shared review/submit page:
- Template flow: catalog → wizard → review
- Custom builder flow: resource catalog → selection → review
- Review & Submit: payload assembly, API call, confirmation modal, proof report

## File Ownership (only touch these)
- `frontend/app/templates/` — template catalog page and slug pages
- `frontend/app/builder/` — custom builder page
- `frontend/app/review/` — review and submit page
- `frontend/components/templates/` — TemplateGrid, FilterPills, TemplateCard
- `frontend/components/wizard/` — Stepper, WizardStep, SummaryPanel
- `frontend/components/builder/` — ResourceCatalog, ResourceDrawer, SelectedPanel
- `frontend/components/review/` — ReviewSection, SubmitButton, ConfirmModal

## Do NOT touch
- `frontend/components/layout/` — owned by foundation work
- `frontend/components/ui/` — owned by foundation work
- `frontend/store/deploymentStore.ts` — read only; do not restructure
- `frontend/lib/` — read only; use existing utilities
- `frontend/types/index.ts` — read only; use existing types

## Rules
1. TypeScript strict mode — no `any`, no type assertions without justification
2. All cross-route state goes through `deploymentStore` (Zustand) — no component-local state that crosses routes
3. Every interactive component needs: ARIA labels, `role` attributes, `aria-invalid` on error fields, keyboard support (Escape closes modals, Enter/Space activates cards), Framer Motion animations must be `reduced-motion` safe
4. Validate all form input with Zod using `buildSchema` from `lib/schema.ts`
5. Use `getIcon` from `lib/icons.ts` for all icons — never import Lucide directly
6. MSW mock handler in `frontend/mocks/handlers.ts` must return the standard error shape from CLAUDE.md when simulating errors

## Commands (run from frontend/)
- Dev server: `npm run dev`
- Tests: `npm run test:run`
- Lint: `npm run lint`
- Build: `npm run build`

## Definition of Done
Each page/component is done when: it renders, state flows correctly through the store, ARIA attributes are present, keyboard navigation works, and tests pass.
```

- [ ] **Step 3: Write A8 — QA/Security/Release**

Create `workflows/agents/a8-qa-security.md`:

````markdown
---
name: a8-qa-security
description: Runs quality gates (lint, tests, build, smoke) and security checks for IAC Sandbox — does not write feature code
tools: Bash, Read, Glob, Grep
---

You are the QA/Security/Release agent for IAC Sandbox.

## Your Responsibility
Run and enforce quality gates. You do not write feature code — you verify it.

## File Ownership
- `frontend/__tests__/` — read/write test files
- Any `*.test.tsx` or `*.test.ts` co-located with components — read/write

## Do NOT touch
- Any non-test file in `frontend/app/`, `frontend/components/`, `frontend/lib/`, `frontend/store/`

## Quality Gate Sequence (always run in this order)

```bash
cd frontend
npm run lint          # must exit 0 — zero errors
npm run test:run      # all tests must pass
npm run build         # /out directory must be produced
```

If any step fails, stop and report the exact error. Do not proceed to the next step.

## Smoke Test Checklist (manual, after build)
Start dev server (`npm run dev`) and verify:
- [ ] Template flow: home → /templates → pick a template → complete wizard → /review → submit → proof modal appears with copyable text
- [ ] Custom builder flow: home → /builder → add resources → /review → submit → proof modal appears
- [ ] Theme toggle: switch dark↔light, reload — theme persists (localStorage key: `sandbox-theme`)
- [ ] Keyboard navigation: Tab through all modals and drawers; Escape closes them; Enter/Space activates cards
- [ ] No console errors (check DevTools console) on any happy path

## Security Checklist
- [ ] No hardcoded secrets, tokens, or credentials in any source file
- [ ] No `any` types in TypeScript that bypass validation
- [ ] All user input validated with Zod before use
- [ ] MSW only active in development (not in production build)
- [ ] No sensitive data logged to console

## Release Gate
All of the above must pass before any phase is marked complete.
````

- [ ] **Step 4: Verify the three files exist**

```bash
ls "/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/agents/"
```

Expected: `a1-product.md  a3-frontend-flows.md  a8-qa-security.md`

---

## Task 3: Write stub agents (A2, A4–A7)

**Files:**
- Create: `workflows/agents/a2-frontend-auth.md`
- Create: `workflows/agents/a4-backend-api.md`
- Create: `workflows/agents/a5-deployment-worker.md`
- Create: `workflows/agents/a6-data-db.md`
- Create: `workflows/agents/a7-devops-infra.md`

- [ ] **Step 1: Write A2 — Frontend Auth (stub)**

Create `workflows/agents/a2-frontend-auth.md`:

```markdown
---
name: a2-frontend-auth
description: Implements Microsoft Entra ID SSO, route guards, and login flow — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Backend JWT validation (T1.2) is complete and Microsoft Entra ID app registration is configured.

## Relevant Spec Sections
- SPEC.md §11 — Authentication and Identity
- SPEC.md §17, Phase 1 — T1.1 (Frontend SSO + route guards)
- SPEC.md §18 — Branch: `feat/a2-frontend-sso-guards`

## Scope (when activated)
- `frontend/app/login/` — login page and SSO redirect
- Route guards: redirect unauthenticated users to `/login`
- Microsoft Entra ID MSAL integration
- Session/token storage on frontend

## Do not activate until
T0.1 (contract freeze) and T1.2 (backend JWT validation) are complete per SPEC.md §17.
```

- [ ] **Step 2: Write A4 — Backend API (stub)**

Create `workflows/agents/a4-backend-api.md`:

```markdown
---
name: a4-backend-api
description: Implements Fastify API routes, JWT validation, and error handling — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Frontend MVP is complete and backend phase begins.

## Relevant Spec Sections
- SPEC.md §8 — Backend Architecture
- SPEC.md §10 — API Contract
- SPEC.md §17, Phase 3 — T3.1 (POST /deployments)
- SPEC.md §18 — Branch: `feat/a4-backend-api-auth-validation`
- `implementation/API_SPEC_OPENAPI.yaml` — frozen contract

## Scope (when activated)
- `backend/` — Fastify server, route handlers, JWT middleware
- Error responses must match the contract in CLAUDE.md §Error Response Contract
- No modifications to `implementation/API_SPEC_OPENAPI.yaml` without an ADR

## Do not activate until
All frontend quality gates pass and PR-1 dependencies are met per SPEC.md §18.
```

- [ ] **Step 3: Write A5 — Deployment Worker (stub)**

Create `workflows/agents/a5-deployment-worker.md`:

```markdown
---
name: a5-deployment-worker
description: Implements Bicep adapter, async deployment execution, and status updates — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Backend API (A4) is complete and Bicep execution pipeline phase begins.

## Relevant Spec Sections
- SPEC.md §12 — Bicep Deployment Execution
- SPEC.md §17, Phase 4 — T4.1–T4.3
- SPEC.md §18 — Branch: `feat/a5-worker-bicep-execution`

## Scope (when activated)
- `backend/` (worker module) — Bicep adapter, async queue, status updates
- Translates API payload → Bicep parameter files
- Polls/updates deployment status: accepted → running → succeeded/failed

## Do not activate until
T3.1 and T3.2 (backend API + persistence) are complete per SPEC.md §17.
```

- [ ] **Step 4: Write A6 — Data/DB (stub)**

Create `workflows/agents/a6-data-db.md`:

```markdown
---
name: a6-data-db
description: Manages Prisma schema, database migrations, and data repositories — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Backend phase begins and database schema needs to be defined.

## Relevant Spec Sections
- SPEC.md §9 — Data Model
- SPEC.md §17, Phase 3 — T3.2 (submission persistence)
- SPEC.md §18 — Branch: `feat/a6-db-audit-persistence`

## Scope (when activated)
- `backend/prisma/` — schema.prisma, migrations
- Repository pattern for submissions and audit trail
- No raw SQL — Prisma only

## Do not activate until
T0.1 (contract freeze) is complete and the data model in SPEC.md §9 is finalised.
```

- [ ] **Step 5: Write A7 — DevOps/Infra (stub)**

Create `workflows/agents/a7-devops-infra.md`:

```markdown
---
name: a7-devops-infra
description: Provisions Azure infrastructure via Bicep, manages CI/CD and managed identity — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Backend API and worker are complete and infrastructure provisioning phase begins.

## Relevant Spec Sections
- SPEC.md §17, Phase 5 — T5.1–T5.3
- SPEC.md §18 — Branch: `feat/a7-devops-infra-cicd`

## Scope (when activated)
- `infra/` — Azure Bicep templates (resource-group scope)
- `.github/workflows/` — CI/CD pipelines with quality gates
- Managed Identity and RBAC for Azure Container Apps + Key Vault
- Environment matrix from T0.2

## Do not activate until
T1–T4 phases are complete and environment mapping (T0.2) is finalised per SPEC.md §17.
```

- [ ] **Step 6: Verify all 8 agent files exist**

```bash
ls "/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/agents/"
```

Expected (8 files):
```
a1-product.md
a2-frontend-auth.md
a3-frontend-flows.md
a4-backend-api.md
a5-deployment-worker.md
a6-data-db.md
a7-devops-infra.md
a8-qa-security.md
```

---

## Task 4: Write phase skills

**Files:**
- Create: `workflows/skills/phase/phase-core.md`
- Create: `workflows/skills/phase/phase-templates.md`
- Create: `workflows/skills/phase/phase-builder-review.md`
- Create: `workflows/skills/phase/phase-qa.md`

- [ ] **Step 1: Write phase-core**

Create `workflows/skills/phase/phase-core.md`:

````markdown
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

```bash
npm run lint       # 0 errors
npm run test:run   # all pass
npm run build      # /out produced
```

## Reference
- Design tokens: CLAUDE.md §Design System
- Proof artifact format: CLAUDE.md §Proof Artifact Format
- API contract: `implementation/API_SPEC_OPENAPI.yaml`
- Data model: SPEC.md §9
````

- [ ] **Step 2: Write phase-templates**

Create `workflows/skills/phase/phase-templates.md`:

````markdown
---
name: phase-templates
description: Template catalog + wizard flow (Phase 3b): TemplateGrid, FilterPills, TemplateCard, Stepper, WizardStep, SummaryPanel
---

# Phase: Template Flow (Phase 3b)

Implement the template selection and wizard flow. Users browse templates, pick one, fill in a multi-step wizard, and land at `/review`.

## Scope — Files to Create or Modify

- `frontend/app/templates/page.tsx` — `/templates` route: renders TemplateGrid with FilterPills
- `frontend/app/templates/[slug]/page.tsx` — `/templates/[slug]` route: renders wizard Stepper
- `frontend/components/templates/TemplateGrid.tsx` — grid of TemplateCards
- `frontend/components/templates/FilterPills.tsx` — category filter buttons ("All" + per-category)
- `frontend/components/templates/TemplateCard.tsx` — single template card with hover lift, keyboard-activatable
- `frontend/components/wizard/Stepper.tsx` — step progress indicator (current/completed/upcoming states)
- `frontend/components/wizard/WizardStep.tsx` — single step: title, form fields via `buildSchema`, Next/Back buttons
- `frontend/components/wizard/SummaryPanel.tsx` — right-side live preview of filled values

## Acceptance Criteria
- `/templates` renders all 8 templates from `data/templates.json`
- FilterPills filter by category; "All" resets to show all
- Clicking a TemplateCard navigates to `/templates/[slug]`
- Wizard shows the correct number of steps for the selected template
- Stepper shows current/completed/upcoming states correctly
- SummaryPanel updates live as form fields are filled
- Final wizard step writes the normalized payload to `deploymentStore` and navigates to `/review`
- All template cards are keyboard-activatable (Enter/Space); Stepper steps have `aria-current`
- No `any` types; all cross-route state in `deploymentStore`

## Quality Gates

```bash
cd frontend
npm run lint
npm run test:run
npm run build
```

## Reference
- Template data shape: `frontend/data/templates.json`
- Store actions: `frontend/store/deploymentStore.ts`
- Field schema utility: `frontend/lib/schema.ts` (`buildSchema`)
- Icon utility: `frontend/lib/icons.ts` (`getIcon`)
````

- [ ] **Step 3: Write phase-builder-review**

Create `workflows/skills/phase/phase-builder-review.md`:

````markdown
---
name: phase-builder-review
description: Custom builder + review/submit flow (Phases 3c–3d): ResourceCatalog, ResourceDrawer, SelectedPanel, ReviewSection, SubmitButton, ConfirmModal, proof artifact
---

# Phase: Builder + Review/Submit (Phases 3c–3d)

Implement the custom resource builder and the shared review/submit page with confirmation modal and copyable proof artifact.

## Scope — Files to Create or Modify

### Builder (Phase 3c)
- `frontend/app/builder/page.tsx` — `/builder` route
- `frontend/components/builder/ResourceCatalog.tsx` — browsable grid of 8 resource types from `data/resources.json`
- `frontend/components/builder/ResourceDrawer.tsx` — slide-in config drawer, Escape to close, fields via `buildSchema`, validated with Zod
- `frontend/components/builder/SelectedPanel.tsx` — list of added resources with remove buttons

### Review + Submit (Phase 3d)
- `frontend/app/review/page.tsx` — `/review` route; redirects to `/` if store is empty
- `frontend/components/review/ReviewSection.tsx` — displays template payload or custom resources correctly for both modes
- `frontend/components/review/SubmitButton.tsx` — calls `submitDeployment` from `lib/api.ts`, shows spinner during submission, disables while loading
- `frontend/components/review/ConfirmModal.tsx` — `role="dialog"`, `aria-modal`, Escape to close; shows copyable proof text from `generateReport`
- `frontend/mocks/handlers.ts` — MSW handler for `POST /deployments`: returns `{ submissionId, status: 'accepted' }` on success; returns standard error shape on error

## Acceptance Criteria
- `/builder` shows all 8 resource types; adding a resource type twice is blocked (store rejects duplicate types)
- ResourceDrawer slides in from right; config fields are validated with Zod before adding to store
- SelectedPanel shows all added resources with working remove buttons
- `/review` redirects to `/` if `deploymentStore` is empty
- ReviewSection renders correctly for both template-mode and custom-mode payloads
- SubmitButton shows spinner during submission and is disabled while loading
- MSW success response: `{ submissionId: 'sub_...',  status: 'accepted' }`
- MSW error response matches CLAUDE.md §Error Response Contract: `{ error: { code, message, details }, requestId }`
- ConfirmModal shows proof text matching CLAUDE.md §Proof Artifact Format; copy button writes text to clipboard
- Both flows (template + custom) complete end-to-end without errors

## Quality Gates

```bash
cd frontend
npm run lint
npm run test:run
npm run build
```

Then run the smoke test checklist (`/smoke`) to verify both flows end-to-end.

## Reference
- Resource data shape: `frontend/data/resources.json`
- Error response contract: CLAUDE.md §Error Response Contract
- Proof artifact format: CLAUDE.md §Proof Artifact Format
- API client: `frontend/lib/api.ts` (`submitDeployment`)
- Report generator: `frontend/lib/report.ts` (`generateReport`)
````

- [ ] **Step 4: Write phase-qa**

Create `workflows/skills/phase/phase-qa.md`:

````markdown
---
name: phase-qa
description: Quality gate phase (Phase 4): lint, tests, build, smoke checklist, and security review for IAC Sandbox frontend
---

# Phase: QA + Release Gates (Phase 4)

This phase IS the quality gate. Nothing passes until all checks are green.

## Sequence (run in order — stop on any failure)

### 1. Lint

```bash
cd frontend && npm run lint
```

Expected: exits with code 0 and no errors reported.
On failure: fix every reported error. Do not add `// eslint-disable` comments unless the reason is documented on the line above.

### 2. Tests

```bash
cd frontend && npm run test:run
```

Expected: all tests pass; zero failures; zero skipped without documented justification.
On failure: read the exact error, fix the component or test. Never delete a failing test.

### 3. Build

```bash
cd frontend && npm run build
```

Expected: `/out` directory produced. Verify:

```bash
ls frontend/out/index.html
```

On failure: check for missing `generateStaticParams` on dynamic routes, `useSearchParams` without a `<Suspense>` boundary, or server-only imports in client components.

### 4. Smoke Test (manual)

Run `/smoke` skill and work through the full checklist with a live dev server.

### 5. Security Review

- [ ] No hardcoded secrets, tokens, or API keys in any source file
- [ ] No `any` TypeScript types that bypass Zod validation
- [ ] All user input validated with Zod before use
- [ ] MSW not active in production: `frontend/out/` should not serve an active `mockServiceWorker.js`
- [ ] No sensitive data (tokens, user IDs, personal info) logged to console

## Done When

All 5 sections complete: 0 lint errors, all tests pass, `/out` produced, smoke checklist fully ticked, security checklist clean.
````

- [ ] **Step 5: Verify all 4 phase skill files exist**

```bash
ls "/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/skills/phase/"
```

Expected: `phase-builder-review.md  phase-core.md  phase-qa.md  phase-templates.md`

---

## Task 5: Write command skills

**Files:**
- Create: `workflows/skills/commands/dev.md`
- Create: `workflows/skills/commands/test.md`
- Create: `workflows/skills/commands/lint.md`
- Create: `workflows/skills/commands/build.md`
- Create: `workflows/skills/commands/smoke.md`

- [ ] **Step 1: Write dev skill**

Create `workflows/skills/commands/dev.md`:

```markdown
---
name: dev
description: Start the IAC Sandbox frontend dev server on localhost:3000
---

# Start Dev Server

```bash
cd frontend && npm run dev
```

The dev server runs at **http://localhost:3000**.

MSW (Mock Service Worker) is active in development — `POST /deployments` is intercepted and returns a mocked response from `frontend/mocks/handlers.ts`. The real backend is not needed.

Confirm MSW is working: open the browser console and look for `[MSW] Mocking enabled.`

To stop: `Ctrl+C`.
```

- [ ] **Step 2: Write test skill**

Create `workflows/skills/commands/test.md`:

```markdown
---
name: test
description: Run the Vitest test suite for the IAC Sandbox frontend
---

# Run Tests

```bash
cd frontend && npm run test:run
```

Runs all tests via Vitest. Output shows pass/fail per file with test names.

**On failure:** the error includes the test name, file path, and line number. Fix the failing implementation — do not delete or skip the test.

**Run a single file:**
```bash
cd frontend && npx vitest run path/to/Component.test.tsx
```

**Run by test name pattern:**
```bash
cd frontend && npx vitest run -t "should prevent duplicate resources"
```

All tests must pass before any phase is complete.
```

- [ ] **Step 3: Write lint skill**

Create `workflows/skills/commands/lint.md`:

```markdown
---
name: lint
description: Run ESLint on the IAC Sandbox frontend — must exit 0 before any phase is done
---

# Run Linter

```bash
cd frontend && npm run lint
```

Must exit with **code 0** (zero errors reported) before any phase is considered complete.

**On failure:** fix every reported error. Do not suppress with `// eslint-disable` comments without a documented reason on the line immediately above.

TypeScript strict mode is enforced — `any` types fail lint.
```

- [ ] **Step 4: Write build skill**

Create `workflows/skills/commands/build.md`:

```markdown
---
name: build
description: Run the Next.js static export build for IAC Sandbox and verify /out is produced
---

# Build Static Export

```bash
cd frontend && npm run build
```

Produces a static export in `frontend/out/`. Verify success:

```bash
ls frontend/out/index.html
```

**Common failure causes:**
- Dynamic routes missing `generateStaticParams` — add static params for all template slugs from `data/templates.json`
- `useSearchParams()` outside a `<Suspense>` boundary — wrap the component
- Server-only imports in a client component — add `'use client'` directive or move the import

The `/out` directory must exist before any phase is marked done.
```

- [ ] **Step 5: Write smoke skill**

Create `workflows/skills/commands/smoke.md`:

```markdown
---
name: smoke
description: Manual smoke test checklist for IAC Sandbox — run after build to verify both deployment flows end-to-end
---

# Smoke Test Checklist

Start the dev server first:
```bash
cd frontend && npm run dev
```

Open **http://localhost:3000** and work through this checklist. Check each item only when verified in the browser.

## Template Flow
- [ ] Home page loads — hero and CTAs visible, no console errors
- [ ] Click "Browse Templates" → `/templates` loads with 8 template cards
- [ ] Filter pills filter the grid by category; "All" resets to show all 8
- [ ] Click a template card → `/templates/[slug]` loads the wizard
- [ ] Stepper shows the correct number of steps for the selected template
- [ ] Fill in all fields — SummaryPanel updates in real time
- [ ] Complete wizard → redirected to `/review`
- [ ] ReviewSection shows the template name and all filled values
- [ ] Click Submit → spinner appears on button, then ConfirmModal opens
- [ ] Proof text in modal matches the format from CLAUDE.md §Proof Artifact Format
- [ ] Copy button writes text to clipboard
- [ ] Close modal → back on review page, no errors

## Custom Builder Flow
- [ ] Navigate to `/builder` — all 8 resource types visible
- [ ] Click a resource → ResourceDrawer slides in from right
- [ ] Fill in config fields; validation prevents empty required fields
- [ ] Close drawer → resource appears in SelectedPanel
- [ ] Attempt to add the same resource type again → blocked (no duplicate added)
- [ ] Navigate to `/review` — added resources listed correctly
- [ ] Submit → ConfirmModal opens with proof text
- [ ] Copy button works

## Cross-Cutting
- [ ] Theme toggle (nav, top-right) switches dark ↔ light
- [ ] Reload page — theme persists (verify `sandbox-theme` key in localStorage)
- [ ] All modals: pressing Escape closes them
- [ ] All interactive cards: Enter and Space activate them
- [ ] DevTools Console: zero errors on any of the above paths
```

- [ ] **Step 6: Verify all 5 command skill files exist**

```bash
ls "/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/skills/commands/"
```

Expected: `build.md  dev.md  lint.md  smoke.md  test.md`

---

## Task 6: Write the install script

**Files:**
- Create: `scripts/install-workflows.sh`

- [ ] **Step 1: Write the install script**

Create `scripts/install-workflows.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# install-workflows.sh
# Copies workflows/ into .claude/ so Claude Code can discover agents and skills.
# Idempotent — safe to re-run after editing any file in workflows/.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

AGENTS_SRC="$ROOT_DIR/workflows/agents"
SKILLS_PHASE_SRC="$ROOT_DIR/workflows/skills/phase"
SKILLS_COMMANDS_SRC="$ROOT_DIR/workflows/skills/commands"
AGENTS_DST="$ROOT_DIR/.claude/agents"
SKILLS_DST="$ROOT_DIR/.claude/skills"

echo "IAC Sandbox — Installing workflows"
echo "Source : $ROOT_DIR/workflows/"
echo "Target : $ROOT_DIR/.claude/"
echo ""

# Create destination directories
mkdir -p "$AGENTS_DST"
mkdir -p "$SKILLS_DST"

# Copy agents
echo "Agents:"
for f in "$AGENTS_SRC"/*.md; do
  name=$(basename "$f")
  cp "$f" "$AGENTS_DST/$name"
  echo "  ✓ $name"
done

# Copy phase skills
echo ""
echo "Phase skills:"
for f in "$SKILLS_PHASE_SRC"/*.md; do
  name=$(basename "$f")
  cp "$f" "$SKILLS_DST/$name"
  echo "  ✓ $name"
done

# Copy command skills
echo ""
echo "Command skills:"
for f in "$SKILLS_COMMANDS_SRC"/*.md; do
  name=$(basename "$f")
  cp "$f" "$SKILLS_DST/$name"
  echo "  ✓ $name"
done

AGENT_COUNT=$(ls "$AGENTS_DST" | wc -l | tr -d ' ')
SKILLS_COUNT=$(ls "$SKILLS_DST" | wc -l | tr -d ' ')

echo ""
echo "Done. Installed $AGENT_COUNT agents and $SKILLS_COUNT skills."
echo "Re-run this script any time you edit files in workflows/."
```

- [ ] **Step 2: Make the script executable**

```bash
chmod +x "/Users/izzatnasri/Code/Personal/IAC Sandbox/scripts/install-workflows.sh"
```

- [ ] **Step 3: Run the script and verify output**

```bash
"/Users/izzatnasri/Code/Personal/IAC Sandbox/scripts/install-workflows.sh"
```

Expected output:
```
IAC Sandbox — Installing workflows
Source : .../workflows/
Target : .../.claude/

Agents:
  ✓ a1-product.md
  ✓ a2-frontend-auth.md
  ✓ a3-frontend-flows.md
  ✓ a4-backend-api.md
  ✓ a5-deployment-worker.md
  ✓ a6-data-db.md
  ✓ a7-devops-infra.md
  ✓ a8-qa-security.md

Phase skills:
  ✓ phase-builder-review.md
  ✓ phase-core.md
  ✓ phase-qa.md
  ✓ phase-templates.md

Command skills:
  ✓ build.md
  ✓ dev.md
  ✓ lint.md
  ✓ smoke.md
  ✓ test.md

Done. Installed 8 agents and 9 skills.
```

- [ ] **Step 4: Verify `.claude/` targets were populated**

```bash
echo "Agents:"; ls "/Users/izzatnasri/Code/Personal/IAC Sandbox/.claude/agents/"
echo "Skills:"; ls "/Users/izzatnasri/Code/Personal/IAC Sandbox/.claude/skills/"
```

Expected: 8 agent files, 9 skill files (4 phase + 5 commands).

---

## Task 7: Write workflows/README.md

**Files:**
- Create: `workflows/README.md`

- [ ] **Step 1: Write the README**

Create `workflows/README.md`:

```markdown
# Workflows — Agents & Skills

Claude Code agents and skills for the IAC Sandbox project. This directory is the **source of truth** — edit files here, then re-run the install script.

## Setup

Run once after cloning, and again after editing any file in `workflows/`:

```bash
./scripts/install-workflows.sh
```

This copies `workflows/agents/` and `workflows/skills/` into `.claude/` where Claude Code discovers them.

---

## Agents

| ID | File | Status | Description | File Ownership |
|----|------|--------|-------------|----------------|
| A1 | `a1-product.md` | **Active** | Requirements, ADRs, scope decisions | `implementation/SPEC.md`, `CLAUDE.md` |
| A2 | `a2-frontend-auth.md` | Stub | Microsoft Entra ID SSO, route guards | `frontend/app/login/` |
| A3 | `a3-frontend-flows.md` | **Active** | Template + Builder + Review flows | `frontend/app/templates/`, `frontend/app/builder/`, `frontend/app/review/`, `frontend/components/` (flows) |
| A4 | `a4-backend-api.md` | Stub | Fastify API, JWT validation | `backend/` |
| A5 | `a5-deployment-worker.md` | Stub | Bicep adapter, async execution | `backend/` (worker) |
| A6 | `a6-data-db.md` | Stub | Prisma schema, migrations | `backend/prisma/` |
| A7 | `a7-devops-infra.md` | Stub | Azure Bicep, GitHub Actions CI/CD | `infra/`, `.github/` |
| A8 | `a8-qa-security.md` | **Active** | Lint, tests, build, smoke, security | `frontend/__tests__/`, co-located test files |

**How to invoke:** Describe the task in natural language — Claude Code selects the matching sub-agent automatically. Or ask explicitly: *"use the A3 frontend flows agent"*.

Stub agents are installed but inactive. Each stub contains the SPEC.md sections to read before activating it.

---

## Skills

### Phase Skills (reference cards for each development phase)

| Skill | Covers | Invoke |
|-------|--------|--------|
| `phase-core` | Foundation (CSS tokens, layout, UI primitives) + Domain (types, store, lib utils) | `/phase-core` |
| `phase-templates` | Template catalog + multi-step wizard flow | `/phase-templates` |
| `phase-builder-review` | Custom resource builder + review/submit page + proof modal | `/phase-builder-review` |
| `phase-qa` | Full quality gate sequence (lint → test → build → smoke → security) | `/phase-qa` |

### Command Skills (daily dev operations)

| Skill | What it does | Invoke |
|-------|-------------|--------|
| `dev` | Start dev server on localhost:3000 (MSW active) | `/dev` |
| `test` | Run Vitest test suite | `/test` |
| `lint` | Run ESLint — must exit 0 | `/lint` |
| `build` | Static export to `/out` | `/build` |
| `smoke` | Manual smoke test checklist for both flows | `/smoke` |

---

## Editing Workflows

1. Edit the file in `workflows/agents/` or `workflows/skills/`
2. Run `./scripts/install-workflows.sh`
3. Claude Code picks up the updated version immediately

Do **not** edit files directly in `.claude/agents/` or `.claude/skills/` — they will be overwritten on the next install.
```

- [ ] **Step 2: Verify the README was created**

```bash
ls "/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/"
```

Expected: `README.md  agents/  skills/`

---

## Task 8: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md` (project root)

- [ ] **Step 1: Add Agents & Skills section to CLAUDE.md**

The Key Documentation section in `CLAUDE.md` ends at line 29 with a `---` divider, immediately before `## Tech Stack`. Insert the new section between those two dividers. Find the exact string:

```
---

## Tech Stack
```

Replace it with:

```
---

## Agents & Skills

All Claude Code sub-agents and project skills are defined in `workflows/` and installed via:

\```bash
./scripts/install-workflows.sh
\```

| Where | Contents |
|-------|----------|
| `workflows/agents/` | 8 sub-agent definitions (A1–A8) matching SPEC.md §17 |
| `workflows/skills/phase/` | Phase reference cards: `phase-core`, `phase-templates`, `phase-builder-review`, `phase-qa` |
| `workflows/skills/commands/` | Dev commands: `dev`, `test`, `lint`, `build`, `smoke` |
| `workflows/README.md` | Full agent + skill index with invocation instructions |

Run the install script after cloning or after editing any file in `workflows/`.

---

## Tech Stack
```

- [ ] **Step 2: Verify the section appears in CLAUDE.md**

```markdown
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
```

- [ ] **Step 3: Verify the section appears in CLAUDE.md**

```bash
grep -n "Agents & Skills" "/Users/izzatnasri/Code/Personal/IAC Sandbox/CLAUDE.md"
```

Expected: a line number containing `## Agents & Skills`

---

## Task 9: Full verification

- [ ] **Step 1: Re-run install script (idempotency check)**

```bash
"/Users/izzatnasri/Code/Personal/IAC Sandbox/scripts/install-workflows.sh"
```

Expected: same output as Task 6 Step 3 — no errors, same file counts.

- [ ] **Step 2: Verify exact file counts**

```bash
echo "Agents in .claude/: $(ls '/Users/izzatnasri/Code/Personal/IAC Sandbox/.claude/agents/' | wc -l | tr -d ' ')"
echo "Skills in .claude/: $(ls '/Users/izzatnasri/Code/Personal/IAC Sandbox/.claude/skills/' | wc -l | tr -d ' ')"
echo "Agents in workflows/: $(ls '/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/agents/' | wc -l | tr -d ' ')"
echo "Skills in workflows/: $(find '/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/skills/' -name '*.md' | wc -l | tr -d ' ')"
```

Expected:
```
Agents in .claude/: 8
Skills in .claude/: 9
Agents in workflows/: 8
Skills in workflows/: 9
```

- [ ] **Step 3: Verify workflows/README.md lists all items**

```bash
grep -c "\.md" "/Users/izzatnasri/Code/Personal/IAC Sandbox/workflows/README.md"
```

Expected: at least 17 (8 agents + 9 skills mentioned).

- [ ] **Step 4: Verify install script is executable**

```bash
test -x "/Users/izzatnasri/Code/Personal/IAC Sandbox/scripts/install-workflows.sh" && echo "executable" || echo "NOT executable"
```

Expected: `executable`

- [ ] **Step 5: Verify CLAUDE.md has the new section**

```bash
grep -A 8 "Agents & Skills" "/Users/izzatnasri/Code/Personal/IAC Sandbox/CLAUDE.md"
```

Expected: the full Agents & Skills section with the table.
