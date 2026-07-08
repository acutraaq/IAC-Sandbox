# Session Handoff — 2026-07-01

> **Version:** 2.1.0 | **Last updated:** 2026-07-01 | **Status:** Active
> **Purpose:** Context for engineers starting a new session
> **Related docs:** [Project Index](../README.md) | [CLAUDE.md](../../CLAUDE.md) | [Complete Spec](../project/SPEC.md)
>
> **Action:** Read this immediately after `CLAUDE.md` if you are starting a new session. Update this file at the end of each session with the current state.

## TL;DR

**Codebase optimization pass completed.** 12 targeted fixes applied across 11 files — no features added, no breaking changes. All 313 tests pass (239 web + 74 functions). Key highlights: policy sync fix (diagnosticSettings removed from web allow-list), queue message schema extracted to single source of truth, `DeploymentPayload` type now sourced from Zod schema only, `getMe()` added to api.ts, `templates.md` corrected (was listing 16 templates, only 3 are live).

---

## What was done in this session (2026-07-01)

### Codebase optimization — 12 fixes across 11 files

| Fix | File(s) | Why |
|-----|---------|-----|
| Remove `diagnosticSettings` from `ALLOWED_RESOURCE_TYPES` | `web/lib/deployments/policy.ts` | Not in functions-side `POLICY_ALLOWED_RESOURCE_TYPES` — custom deployments using it would pass web check then fail in Function and poison-queue |
| Null guard on `tokenResponse` | `web/app/api/healthz/arm/route.ts` | `credential.getToken()` can return null; unguarded access would throw uncaught error |
| Extract `deploymentJobMessageSchema` | `functions/src/modules/deployments/deployment.schema.ts` | Was copy-pasted identically in `processDeployment.ts` and `processPoisonDeployment.ts` — now single source |
| Import shared schema | `functions/src/functions/processDeployment.ts`, `processPoisonDeployment.ts` | Remove local duplicate, import from schema |
| Remove dead `allResources` alias | `functions/src/modules/deployments/arm-template-builder.ts:712` | `const allResources = primaryResources` — no-op remnant from removed supporting-resource bundling |
| Remove unused `LOG_LEVEL` | `functions/src/lib/env.ts`, `functions/src/__tests__/lib/env.test.ts` | Parsed and stored but never read anywhere; Functions runtime controls log verbosity via host.json |
| `BlobServiceClient` singleton | `web/lib/deployments/failure-lookup.ts` | Was reconstructed on every call (every 3s status poll) |
| `DeploymentPayload` import source | `web/lib/api.ts` | Changed from `@/types` to `@/lib/deployments/schema` — Zod-inferred type is authoritative |
| Add `getMe()` helper | `web/lib/api.ts` | Missing canonical helper; review page was using raw `fetch("/api/auth/me")` |
| Use `getMe()` | `web/app/review/page.tsx` | Replace raw fetch with api.ts helper (per CLAUDE.md canonical patterns) |
| Remove duplicate payload types | `web/types/index.ts` | `TemplateDeploymentPayload`, `CustomDeploymentPayload`, `DeploymentPayload` union removed — now sourced from Zod schema exclusively |
| Add `getMe` to test mock | `web/__tests__/app/review/page.test.tsx` | Mock for `@/lib/api` needed to include new export |

### Documentation updates
- `templates.md` — corrected from 16 templates to 3 (actual `templates.json` content); added ARM builder inventory section
- `CLAUDE.md` — updated canonical patterns table (getMe, schema sync note, payload type note), directory layout comments
- `HANDOFF.md` — this file

### Test results
- `functions/` `npx vitest run` → **74 passed**
- `web/` `npx vitest run` → **239 passed**
- `web/` `npx tsc --noEmit` → **0 errors**
- `functions/` `npx tsc --noEmit` → **0 errors**

### What is NOT done (next session candidates)
- **templates.md discrepancy investigation** — `arm-template-builder.ts` has builders for 10+ additional slugs; `templates.json` only exposes 3. Determine if the remaining 10 should be added to the UI catalog or remain as builder-only.
- **End-to-end verification** — confirm a real template submission progresses from `accepted` → `running` → `succeeded` in `sub-epf-sandbox-internal`
- **Function App env vars** — confirmed live 2026-07-08 (see Current State below); queue processing itself still not observed via a real submission

---

## What was done in the previous session (2026-05-22)

### Supporting-resource bundling: LAW + KV auto-injected
- **`functions/src/modules/deployments/arm-template-builder.ts`**
  - Added `createLogAnalyticsWorkspace()` and `makeLawName()` / `makeKvName()` helpers
  - Updated `buildArmTemplate()` to inject LAW + KV after primary resources are built
  - Added type-level deduplication: skips LAW injection if primary set already contains a workspace; skips KV injection if primary set already contains a vault (`landing-zone` and `full-stack-web-app` already include these, so they don't duplicate)
  - Tags are applied to all resources (primary + supporting) after assembly
- **`web/lib/deployments/policy.ts`** — verified LAW + KV already in `ALLOWED_RESOURCE_TYPES`; policy file stayed in sync without changes
- **`web/data/templates.json`** — updated all 12 deployable template descriptions to mention LAW + KV inclusion; updated `resourceCount` where counts changed
- **`web/data/resources.json`** — updated all 9 deployable custom-builder resource descriptions to mention LAW + KV inclusion
- **`functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`** — updated all exact-count assertions:
  - `web-application`: 2 → 4 (plan + site + law + kv)
  - `database`: 1 → 3
  - `storage-account`: 1 → 3
  - `virtual-network`: 1 → 3
  - `key-vault`: 1 → 2 (kv deduped)
  - `container-app`: 2 → 4 (env + app + law + kv)
  - `approval-workflow`: 1 → 3
  - `scheduled-automation`: 1 → 3
  - `message-queue`: 1 → 3
  - `event-broadcaster`: 1 → 3
  - `full-stack-web-app`: 6 → 7 (6 primary + law; kv already in primary set)
  - `landing-zone`: unchanged (3 primary, law + kv already inside; no dupes)

### Test results
- `functions/`  npx vitest run  →  **130 passed**
- `web/`        npx vitest run  →  **193 passed**
- Total: **323 passed**

### What is NOT done (next session candidates)
- **End-to-end verification** — confirm a real template submission progresses from `accepted` → `running` → `succeeded` in `sub-epf-sandbox-internal` with LAW + KV in the resource group
- **Function App env vars** — azure-infra.md marks all steps complete, but queue processing has not been observed working live; verify a deployment actually moves past `accepted`
- **Builder page** — the custom builder (`/builder`) also produces +2 supporting resources per resource; confirm summary panel and review page reflect this correctly

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

### Resolved 2026-07-08: Function App env vars confirmed live

Both health checks pass as of 2026-07-08:
- App Service: `GET /api/healthz/arm` → `{"status":"ok"}`
- Function App: `GET https://epf-sandbox-functions-d2f0a8huescxghgq.southeastasia-01.azurewebsites.net/api/healthz` → `{"status":"ok","mi":true}`

No admin action outstanding. Env vars (`DEPLOYMENT_QUEUE`, `AZURE_STORAGE_CONNECTION_STRING`, `AzureWebJobsStorage`, `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`) are set and both managed identities are functioning.

**Still open:** no real template submission has been observed progressing `accepted` → `running` → `succeeded` end-to-end. Next session should submit a storage-account or Template-flow Logic App and confirm the resource group appears in `sub-epf-sandbox-internal` with all 6 ARM tags.

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
