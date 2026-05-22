# Session Handoff — 2026-05-22

> **Version:** 2.0.0 | **Last updated:** 2026-05-22 | **Status:** Active
> **Purpose:** Context for engineers starting a new session
> **Related docs:** [Project Index](../README.md) | [CLAUDE.md](../../CLAUDE.md) | [Complete Spec](../project/SPEC.md)
>
> **Action:** Read this immediately after `CLAUDE.md` if you are starting a new session. Update this file at the end of each session with the current state.

## TL;DR

**Supporting-resource bundling implemented.** Every template and custom-builder resource now auto-deploys a Log Analytics workspace and a Key Vault alongside its primary resources. Web descriptions and resource counts updated. All 323 tests pass (193 web + 130 functions). Functions/` `arm-template-builder.test.ts` assertions updated to reflect new resource counts (1→3 for single-resource templates, 2→4 for paired templates, 6→7 for full-stack). Policy allow-lists already included LAW/KV so no new types were needed.

---

## What was done in this session (2026-05-22)

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
- **Deploy to Azure** — commit and push to `main` to deploy to App Service + Function App
- **End-to-end verification** — test a real template submission via frontend and confirm RG + LAW + KV appear in `sub-epf-sandbox-internal`
- **CLAUDE.md v2.5.1** — update the Template Catalog table to reflect new resource counts and descriptions
- **Resource count display** — some templates show `"resourceCount": 4` (e.g., `web-application`) but user asked to keep counts accurate; verify UI renders the updated numbers correctly
- **Builder page** — the custom builder (`/builder`) now also produces +2 supporting resources per resource. Confirm the summary panel and review page reflect this correctly.

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
