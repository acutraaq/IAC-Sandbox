# Session Handoff — 2026-07-10

> **Version:** 2.2.0 | **Last updated:** 2026-07-10 | **Status:** Active
> **Purpose:** Context for engineers starting a new session
> **Related docs:** [Project Index](../README.md) | [CLAUDE.md](../../CLAUDE.md) | [Complete Spec](../project/SPEC.md)
>
> **Action:** Read this immediately after `CLAUDE.md` if you are starting a new session. Update this file at the end of each session with the current state.

## TL;DR

**Long-term risk audit + all 11 High severity findings fixed.** A deep multi-agent audit (59 agents) surfaced 28 findings across 8 risk dimensions, 26 confirmed after adversarial verification (2 refuted). All 11 High severity items are now fixed; 11 Medium + 4 Low remain open (see below). Two of the fixes were real feature builds, not just bug fixes — an expired-RG reaper timer function and a global submission rate limiter — both scoped in with the user before building since they involved destructive automation / a rate threshold. All 347 tests pass (254 web + 93 functions).

---

## What was done in this session (2026-07-10)

### Audit
Deep workflow-based audit (whole project, weighted toward the deployment pipeline): 8 finder dimensions → adversarial verify (1-3 refuters per finding by severity) → completeness critic. Findings ranked by 6-12 month blast radius, not by what's broken today. Full finding list preserved in conversation history; the highlights below are what got fixed.

### Fixes — 11 High severity findings

| Fix | File(s) | Why |
|-----|---------|-----|
| Fail closed on invalid `SESSION_SECRET` | `web/proxy.ts` | `verifySessionCookie()` threw uncaught on a missing/short secret — every authenticated route 500'd instead of redirecting to `/login`. A routine secret rotation was a full outage. |
| Trim custom-mode resource-type allow-list | `web/lib/deployments/policy.ts`, `functions/src/modules/deployments/arm-template-builder.ts` | Web-side allow-list had 18/30 types with no builder case — passed validation, enqueued, then silently poison-queued. Trimmed to what `buildCustomResources` actually supports (11 input types); functions-side list kept a few extra companion types since it also gates *generated* resources like `Microsoft.Web/serverfarms`. |
| Widen RG-name collision suffix | `web/lib/deployments/rg-name.ts` | Suffix was 6 hex chars (24 bits) sliced from the submissionId UUID — collided at moderate volume, and ARM would silently merge into the colliding RG. Now uses the full UUID (128 bits). |
| Failure record on malformed queue message + poison-queue auto-delete | `functions/src/functions/processDeployment.ts`, `processPoisonDeployment.ts` | Zod-validation-drop wrote nothing, so `GET /api/deployments/:id` could never distinguish "still queued" from "silently dropped." Now writes a best-effort failure record. Poison handler now also deletes the orphaned RG — reasoned through every poison path (Zod-drop never creates an RG; RG-create failure leaves nothing to delete; PUT-rejected leaves an RG with zero provisioned resources) — nothing valuable is ever discarded. |
| Check failure record before reporting `"accepted"` | `web/app/api/deployments/[submissionId]/route.ts` | RG-404 branch defaulted straight to `"accepted"` forever; now checks the failure record first (with an ownership check on `deployedBy` so it can't leak another user's failure reason). |
| ARM API version + request timeout | `functions/src/modules/deployments/bicep-executor.ts` | Hardcoded `2021-04-01`, no timeout — bumped to `2024-03-01`, added a 30s `AbortController` timeout on the deployment PUT. |
| Schema-drift check always runs | `.github/workflows/ci.yml` | Lived inside the path-filtered `web` job — a functions-only schema edit skipped the only check that would catch drift. Moved to its own unconditional job. |
| `cancel-in-progress` doesn't kill main deploys | `.github/workflows/ci.yml` | Was unconditionally `true` — a second push to `main` could cancel a live Azure deploy mid-way. Now `${{ github.ref != 'refs/heads/main' }}`. |
| Silent failure-only status check | `web/app/review/page.tsx` | Deployment status endpoint was fully built but dead code — no UI called it. **Did not** just restore the old 3-step progress timeline: git history showed it was deliberately removed (commit `1f4ca28`) because it was misleading vs. the real HOD-approval workflow. Instead built a background poll that stays invisible unless the deployment fails, then shows one error toast. Known limitation: page-scoped, stops if the user navigates away. |
| Expired-RG reaper | new `functions/src/functions/reapExpiredDeployments.ts` | `Expiry Date` tag was validated but never enforced — resources billed forever past expiry. Daily timer function (03:00 UTC) deletes RGs past their `Expiry Date`, gated strictly on the presence of the app's own `iac-submissionId` tag so it never touches a resource group it didn't create. |
| Submission rate limiting | new `web/lib/deployments/rate-limit.ts` | No cap on submissions — could exhaust Azure's per-region storage-account quota. Global rolling-window cap (20/hour) via a single blob + ETag optimistic concurrency; fails open on any storage error. Global (not per-user) since auth is still the shared placeholder identity. |

Also fixed as quick wins during the initial audit pass (before the High-severity round): 2 lint warnings (unused vars in 2 test files), duplicated `SESSION_SECRET` min-length check (now one constant), duplicated `NODE_ENV` cookie-`secure` check across 3 auth routes (now one helper), `dependencies.md` doc drift (`@azure/storage-blob` was undocumented in functions prod deps).

### Decisions made with the user before building
- Orphan RG cleanup: auto-delete (not tag-only, not skip)
- Dead status endpoint: build the failure-only silent poll (not full timeline restore, not docs-only)
- Expiry Date enforcement: real timer-function auto-delete (not report-only)
- Rate limit: yes, global ~20/hour cap

### Test results
- `web/` → **254 passed** (41 files), lint 0 errors, tsc 0 errors, build clean
- `functions/` → **93 passed** (8 files), lint 0 errors, tsc 0 errors, build clean

### What is NOT done (next session candidates)
- **11 Medium + 4 Low severity findings from the 2026-07-10 audit**, not yet actioned:
  - Medium: fixed no-backoff retry cadence (`host.json`); SQL/Postgres builders regenerate a random admin password on every build, breaking idempotency under redelivery; Zod-drop path fix and RG-created-before-outcome are related to already-fixed items but worth re-checking together; `proxy.ts` dot-suffix matcher + auth fail-open could form a bypass trap for future routes; `deployedBy`/my-deployments keyed on a mutable MSAL claim not an immutable identity; schema-drift diff is a hand-tuned `sed`/`diff` pipeline, not a semantic check; resource-type allow-list is still hand-duplicated across web/functions with no automated equality check (only trimmed this session, not de-duplicated); template-mode slug enforcement is a manual quadruple across services; no post-deploy health/smoke gate in CI; publish-profile (Basic Auth) deploy credentials have no rotation policy or failure alerting
  - Low: hardcoded-feeling but now-current ARM API version will age again eventually; poison-queue failure blobs have no TTL/lifecycle policy; the reactivated 3s poll has no explicit max-attempts cap beyond the ~5 min built into `review/page.tsx` (worth hardening if the poll ever becomes app-wide); MSAL's default in-memory token cache has no eviction path
- **Completeness-critic gaps flagged but not investigated:** no log aggregation/alerting for poison/failed deploys; no DR/backup for the storage account holding all queue + failure state; no npm audit/Dependabot/SBOM gate in CI; no monitoring of subscription-level ARM throttling/quota; **Function App managed identity has Contributor over the *entire* subscription, not scoped per-RG — combined with `deployedBy` having no ACL, once SSO activates any authenticated user could query another user's deployments.** This last one is worth prioritizing before SSO activation.
- **Test hygiene (noticed, not fixed, out of this session's scope):** `processPoisonDeployment.test.ts`'s ARM-failure-reason lookup makes a real outbound network call in tests (relies on a dummy subscription ID 404ing) instead of mocking `fetch` — fragile, not something this session touched or broke.
- **Silent-poll limitation:** the new review-page failure check is page-scoped and stops on navigation away — if broader coverage (surviving navigation, or a dedicated notifications view) is wanted, that's a bigger design conversation, not a quick follow-up.
- **End-to-end verification** — still nobody has confirmed a real template submission progresses `accepted` → `running` → `succeeded` in `sub-epf-sandbox-internal`. Worth doing now that failure visibility actually works, to prove the whole loop including the new failure-only poll.
- **Not committed yet** — everything in this session is working-tree only as of this writeup.

---

## What was done in the previous session (2026-07-01)

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
- **Microsoft SSO** — fully implemented, not activating. Placeholder `demo@sandbox.local` is accepted state. **Before activating:** address the Function App MI subscription-wide Contributor + no-ACL-on-`deployedBy` gap noted in the 2026-07-10 session — right now that's low-risk because everyone shares one placeholder identity, but it becomes a real cross-user data leak once real identities exist.
- **Error UX** — 2026-07-10 session added a silent failure-only toast on the review page (see Architecture in CLAUDE.md), but that's a narrow fix, not the full audit. Broader error UX (my-stuff page, richer error detail) still not scheduled.
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
