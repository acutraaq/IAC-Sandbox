# Session Handoff — 2026-05-18

> **Version:** 1.9.0 | **Last updated:** 2026-05-18 | **Status:** Active
> **Purpose:** Context for engineers starting a new session
> **Related docs:** [Project Index](../README.md) | [CLAUDE.md](../../CLAUDE.md) | [Complete Spec](../project/SPEC.md)
>
> **Action:** Read this immediately after `CLAUDE.md` if you are starting a new session. Update this file at the end of each session with the current state.

## TL;DR

**Reliability fixes completed and committed.** All 6 `functions/` pipeline hardening commits are on `main` (sanitize guards, secureString passwords, landing-zone validation, poison handler safety). **Web-layer hardening committed** (`c3ea152`): API route validation, double-submit prevention, blob data Zod validation, a11y labels, Modal `aria-labelledby`. **Docs updated** (`CLAUDE.md` v2.5.0, `HANDOFF.md` v1.9.0). **Stale branches cleaned up.** All 308 tests pass (193 web + 115 functions). Waiting on admin to configure Function App env vars before end-to-end queue consumption can be verified.

---

## What was done in this session (2026-05-18)

### Web-layer hardening committed (`c3ea152`)
- `web/app/api/deployments/[submissionId]/route.ts` — UUID format validation on `submissionId`; returns 400 for invalid IDs
- `web/app/api/my-deployments/route.ts` — escapes `'` in user UPN for ARM OData filter; safer `top` param parsing
- `web/lib/deployments/failure-lookup.ts` — Zod schema validation for blob JSON before returning `FailureRecord`
- `web/lib/deployments/rg-name.ts` — strips trailing `-_.` after length clamp (prevents invalid Azure RG names)
- `web/components/ui/Modal.tsx` — `aria-label` → `aria-labelledby="dialog-title"` + `<h2 id="dialog-title">` for screen readers
- `web/app/review/page.tsx` — `submittingRef` prevents double-submit race; redirects `custom-request` mode away from `/review`
- `web/store/deploymentStore.ts` + `web/types/index.ts` — removed stale `deploymentStatus`/`deploymentError` fields
- `web/app/my-stuff/page.tsx` — switched to `getPublicAzureEnv()` for subscription ID
- `.claude/settings.json` — reverted hook path from absolute to relative (portable across machines)

### Functions reliability fixes already on `main` (from 2026-05-15)
All 6 commits from the `2026-05-15-deployment-pipeline-reliability` spec are merged:
- Sanitize min-length guards (`fa181b8`)
- Landing-zone `InvalidDeploymentConfigError` (`44b351a`)
- SQL/PostgreSQL `secureString` parameters + SQL API GA (`0650dd7`)
- `bicep-executor` strips `_deployParameters` (`ed62b21`)
- `processDeployment` catches config errors without retry (`7779d85`)
- Poison handler never throws (`2fe78d0`)

### Docs maintenance
- `CLAUDE.md` → v2.5.0: latest commit note, admin-action refresh, version bump
- `HANDOFF.md` → v1.9.0: this entry
- Reliability spec and plan moved to `docs/superpowers/archive/`

### Branch hygiene
- Deleted stale remote branches: `feature/formal-proof-labels`, `feature/remove-deployment-status-polling` (both already merged to `main`)

---

## Current State

### What is live
- Terminal-native document redesign deployed to all pages
- `host.json` timeout fixed — Function App runtime loads
- healthz function deployed to Function App (ARM probe)
- App Service: `/api/healthz/arm` = `{"status":"ok"}` ✅
- Placeholder login works: `demo@sandbox.local`
- Functions reliability fixes committed and deployed
- Web-layer hardening committed and deployed

### Blocking: Function App env vars (admin action required)

Portal path: `epf-sandbox-functions` → Settings → Environment variables

| Setting | Required value |
|---------|---------------|
| `DEPLOYMENT_QUEUE` | Full Azure Storage connection string for `coeiacsandbox8bfc` |
| `AZURE_STORAGE_CONNECTION_STRING` | Same connection string |
| `AzureWebJobsStorage` | Same connection string (Functions runtime requires this) |
| `AZURE_SUBSCRIPTION_ID` | `1fed33d2-00fd-40a8-a5c1-c120aec1b902` |
| `AZURE_TENANT_ID` | `3335e1a2-2058-4baf-b03b-031abf0fc821` |

After saving, verify:
1. `GET https://epf-sandbox-functions-d2f0a8huescxghgq.southeastasia-01.azurewebsites.net/api/healthz` → `{"status":"ok","mi":true}`
2. Submit a storage-account template → status should progress from `accepted` → `running` → `succeeded`

### On hold
- **Microsoft SSO** — fully implemented, not activating. Placeholder `demo@sandbox.local` is accepted state.
- **Error UX** — surface ARM errors in review modal + my-stuff page (next planned sprint)
- **a11y audit** — lighthouse/axe-core, high/medium findings

---

## What was done in the previous session (2026-05-14 — second pass)

### host.json fix
- `functionTimeout` was `"00:28:00"` — exceeds Consumption Y1 plan limit of `< 00:10:00`
- Function App showed "Functions runtime error" notification in portal, "Runtime version: Error"
- Fixed to `"00:09:00"` and deployed via CI. Functions job: ✅ success

### Terminal-native redesign committed and deployed
- All 60 pending dirty files committed and pushed to main
- Web CI: ✅ success (standalone build, deployed to App Service)
- Functions CI: ✅ success (deployed to `epf-sandbox-functions` in `sub-epf-sandbox-cloud`)

### Proof artifact fixes (from previous session, now deployed)
- `Tenant` field: real tenant ID (not subscription name)
- `Target RG`: uses `resourceGroup` from API response (includes submissionId suffix)

### Infra doc corrections
- CLAUDE.md: Function App hosting sub corrected to `sub-epf-sandbox-cloud (bcef681c-...)`
- `.gitignore`: added `/.next/` to root-level excludes
- `azure-infra.md`: updated status, added `AzureWebJobsStorage` requirement, corrected healthz URL, added warning about env var startup failure
- `azure-infra.md`: real Function App hostname: `epf-sandbox-functions-d2f0a8huescxghgq.southeastasia-01.azurewebsites.net`

### Smoke test
- POST `/api/deployments` → 201 ✅ (submissionId + resourceGroup returned, queue message enqueued)
- Status poll: stuck at `accepted` — Function App env vars likely missing (see blocking items above)

---

## What was done in the previous session (2026-05-14 — first pass)

### Proof artifact fixes (`web/lib/report.ts`, `web/app/review/page.tsx`)
- `Tenant` field: was hardcoded `sub-epf-sandbox-internal`. Now uses real tenant ID.
- `Target RG`: now receives `result.resourceGroup` from API response.

### Deployment flow debugging
- Root-caused "stuck at Submitted": POST succeeds, queue enqueues, but Function App was crashing on startup due to `FunctionTimeout` runtime error.

---

## What was done in the previous session (2026-05-13)

- Terminal-native document redesign: Navbar, Footer, Breadcrumb, PageEyebrow, TemplateRow, MonoSectionHeader, DocumentDivider, TerminalHero, ConfirmModal mono timeline
- New tokens: `color-prompt`, `color-comment`, line-gutter utility
- Login page: terminal panel layout
- All 209 tests passed (at that point)

---

## Standing user preferences
- `.claude/` is the source of truth for Claude Code agents/skills/hooks
- Active specs in `docs/superpowers/specs/`; active plans in `docs/superpowers/plans/`; completed work → `docs/superpowers/archive/`
- Git worktrees under `.worktrees/` for isolated feature work
- TypeScript strict mode, no `any`, Zod at API boundaries
- Run tests from `web/` or `functions/` subdirectories (NOT repo root)

## Other context
- User in Malaysia (en-MY locale). Project: EPF (Employees Provident Fund Malaysia) sandbox IAC platform.
- Live: `https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net`
- Function App: `epf-sandbox-functions` in `sub-epf-sandbox-cloud (bcef681c-2e70-4357-8fa3-c36b558d61da)`
- Function App real hostname: `epf-sandbox-functions-d2f0a8huescxghgq.southeastasia-01.azurewebsites.net`
- Tech stack and conventions: `CLAUDE.md`. Read it first.
