# CLAUDE.md — Project Conventions & Developer Guidance

> **Version:** 2.6.0 | **Last updated:** 2026-07-10 | **Status:** Active  
> **Purpose:** Single source of truth for project conventions, tech stack, and development patterns  
> **Owner:** All engineers | **Review cadence:** On every convention or pattern change  
> **Related docs:** [Documentation Index](docs/README.md) | [Complete Spec](docs/project/SPEC.md) | [Glossary](docs/GLOSSARY.md) | [HANDOFF](docs/superpowers/HANDOFF.md)

---

## Session Context — Read This First

**MANDATORY: Every session must start by reading this file in full before taking any action.** This is the single source of truth for project state, conventions, and what is live vs blocked. Do not rely on memory or prior-session assumptions — read this file, then act.

> **If continuing from a prior session (especially on a new device), read [`docs/superpowers/HANDOFF.md`](docs/superpowers/HANDOFF.md) immediately after this file.** It captures the open PR state, what was done last, and what's next.

Before starting any work, check `docs/superpowers/specs/` for any active (non-archived) specs that have been designed but not yet implemented.

No active specs or plans. All approved work is implemented; completed designs live under `docs/superpowers/archive/`.

**What is live and working:** Terminal-native document redesign (mono nav chrome, editorial rows, `~/path` eyebrows); supporting-resource bundling (LAW + KV auto-injected into every deployment); silent failure-only status check on the review page; automatic reclamation of orphaned/expired resource groups; global submission rate limiting; see Live Deployment section below.  
**Latest session (2026-07-10):** Long-term risk audit + fixes (deep multi-agent pass, 26 confirmed findings, all 11 High now resolved). Highlights: `proxy.ts` fails closed on invalid `SESSION_SECRET` instead of crashing; custom-mode resource-type allow-list trimmed to match what `buildCustomResources` can actually build; RG-name collision risk fixed (full-UUID suffix, was 6 chars); poison-queue handler now writes a failure record for malformed messages *and* auto-deletes the orphaned RG; `GET /api/deployments/:id` checks the failure record before ever saying `"accepted"`; ARM API version bumped + PUT now has a 30s timeout; CI schema-drift check now runs unconditionally (was path-filter-gated, missed functions-only changes) and `cancel-in-progress` no longer kills an in-flight main-branch deploy; review page silently polls for failure only (no misleading progress bar — see Architecture); new daily timer function reaps resource groups past their `Expiry Date` tag (only ever touches RGs it tagged itself); new global rate limit (20 submissions/hour) on `POST /api/deployments`. 254 web + 93 functions tests passing. See HANDOFF.md for full change list.
**2026-07-08 verification:** `GET /api/healthz/arm` → `{"status":"ok"}` and Function App `GET /api/healthz` → `{"status":"ok","mi":true}` — both confirmed live. Function App env vars are set and managed identity is working on both services. Only remaining gap: no real template submission has been observed progressing `accepted`→`running`→`succeeded` yet.
**What is designed but not built:** Nothing formally speced. Open items tracked in HANDOFF.md not yet actioned: 13 extra ARM builder slugs not exposed in the template catalog — 10 never-catalogued (`web-application`, `container-app`, etc.) plus `approval-workflow`, `scheduled-automation`, and `static-web-app` pulled from the catalog for now (see `.claude/rules/templates.md`) — end-to-end deployment verification (real template submission through to `succeeded`) still pending, and an a11y audit not yet scheduled. 11 medium + 4 low severity findings from the 2026-07-10 audit remain open (schema-drift diff is a hand-tuned sed pipeline not a semantic check, allow-list still hand-duplicated across web/functions with no automated equality check, no post-deploy health/smoke gate, publish-profile creds have no rotation/alerting, MSAL in-memory token cache unbounded, among others — see HANDOFF.md).
**SSO status:** Microsoft SSO / MSAL is **on hold** — placeholder login is live and sufficient for current needs. The MSAL plumbing is fully implemented but not being activated at this time. See Authentication section.
**What needs admin action:** Nothing outstanding for managed identity / env vars — confirmed live 2026-07-08 (see above). The new expired-RG reaper and orphaned-RG auto-delete both reuse the Function App's existing Contributor role on `sub-epf-sandbox-internal` — no new role assignment needed. Remaining action is non-admin: submit a real test deployment (e.g., Storage Account or a Template-flow Logic App) and confirm the resource group appears in `sub-epf-sandbox-internal` with all 6 ARM tags.

---

## Project Overview

**Sandbox IAC** is an Azure Infrastructure-as-Code deployment platform for EPF (Employees Provident Fund, Malaysia). It lets non-expert users configure and submit Azure infrastructure deployments through the Template Flow:

- **Template Flow** — Multi-step wizard using predefined templates (2 templates, automation category only — `approval-workflow`, `scheduled-automation`, `static-web-app` pulled for now)

The Template flow converges at a shared Review & Submit page, calling `POST /api/deployments`. After submission, a copyable plain-text proof artifact is generated for manual HOD approval. Deployment status is tracked via Azure ARM — ARM is the source of truth (no database).

> **Note:** The Custom Builder and Custom Request *frontend* flows have been removed — no `/builder` or `/request` route, no UI entry point. Only the Template flow is currently active in the UI. **However, the backend still accepts and executes `mode: "custom"` payloads** — `customDeploymentSchema` in `web/lib/deployments/schema.ts`, the custom-mode branch in `web/lib/deployments/policy.ts`, and `buildCustomResources()` in `functions/src/modules/deployments/arm-template-builder.ts` are all still live and will build real ARM resources if `POST /api/deployments` is called directly with `mode: "custom"`. This is dormant, unreachable-from-UI code, not a removed capability — treat it as a live API surface when reasoning about security/policy boundaries.

**SSO:** Microsoft SSO (Entra ID / MSAL.js) is **on hold**. MSAL plumbing is fully implemented (auth code + PKCE flow, callback handler, `deployedBy` wired end-to-end) but not being activated at this time. A **placeholder login page** is live: visiting any protected route redirects to `/login`, where the "Sign in with Microsoft" button stubs a session cookie carrying `demo@sandbox.local`. When the team decides to activate SSO, the swap is a single-file change to `web/lib/auth.ts` (see Authentication section below).

---

## Live Deployment

**URL:** `https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net`

**Infrastructure:**

| Resource | Name | Subscription |
|----------|------|--------------|
| Azure App Service (Linux, Node 22, B1 SKU) | `epf-experimental-sandbox-playground` | sub-epf-sandbox-cloud (`bcef681c-2e70-4357-8fa3-c36b558d61da`) |
| Azure Function App (queue-triggered) | `epf-sandbox-functions` | sub-epf-sandbox-cloud (`bcef681c-2e70-4357-8fa3-c36b558d61da`) |
| Azure Storage Account + Queue (`deployment-jobs`) | `coeiacsandbox8bfc` | sub-epf-sandbox-internal (`1fed33d2-00fd-40a8-a5c1-c120aec1b902`) |
| User-deployed resource groups (ARM target) | — | sub-epf-sandbox-internal (`1fed33d2-00fd-40a8-a5c1-c120aec1b902`) |

**App Service env vars (required):**

| Variable | Purpose |
|----------|---------|
| `AZURE_SUBSCRIPTION_ID` | Deployment target / hosting subscription (`1fed33d2-00fd-40a8-a5c1-c120aec1b902`) — sub-epf-sandbox-internal |
| `AZURE_TENANT_ID` | Azure tenant ID (`3335e1a2-2058-4baf-b03b-031abf0fc821`) |
| `AZURE_STORAGE_CONNECTION_STRING` | Storage account connection string for queue (must point to storage in `sandbox-internal`) |
| `SESSION_SECRET` | HMAC secret for the placeholder session cookie. ≥ 32 chars. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |

**GitHub Secrets required:**

| Secret | Used by |
|--------|---------|
| `AZUREAPPSERVICE_PUBLISHPROFILE_7331FFE3C5B34C84A639B5C17E1CA22E` | Web App deployment |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Function App deployment (download from Azure Portal → `epf-sandbox-functions` → Get publish profile) |

> CI/CD workflow details (standalone assembly, oryx config, zip steps): see `.claude/rules/cicd.md` — auto-loads when editing `.github/`.  
> Managed identity setup: see `.claude/rules/azure-infra.md` — auto-loads when editing `functions/src/`. Both services use System-Assigned Managed Identity with roles on `sub-epf-sandbox-internal`: **App Service = Reader** (polls ARM status, lists RGs by tag), **Function App = Contributor** (creates RGs, deploys ARM templates).

---

## Authentication

All routes are gated by `web/proxy.ts` (Next.js 16's middleware convention). Unauthenticated requests are redirected to `/login?next=<original-path>`. Public paths bypass the gate: `/login`, `/api/auth/*`, `/api/healthz` (and sub-paths like `/api/healthz/arm`), Next.js internals, and static files.

Identity comes from `getCurrentUser()` in `web/lib/auth.ts`. Today this reads an HMAC-signed session cookie (`iac_session`, Web Crypto SHA-256, 24 h TTL) and returns the placeholder user `{ upn: "demo@sandbox.local", displayName: "Demo User" }`. The cookie is created by `GET /api/auth/login` (clicked via the stub "Sign in with Microsoft" button — a GET redirect handler, not POST; it falls back to the placeholder stub when MSAL env vars are unset) and cleared by `POST /api/auth/logout`.

The core cookie signing/verification logic lives in `web/lib/auth-core.ts`, which is Edge-safe and used by `proxy.ts` (avoids importing `next/headers` in the middleware layer).

**MSAL swap:** MSAL plumbing is fully implemented — authorization code + PKCE flow at `web/lib/msal.ts`, GET redirect login at `GET /api/auth/login`, and OAuth callback handler at `GET /api/auth/callback/azure-ad`. `deployedBy` is wired end-to-end: session → queue message → ARM tags via `getCurrentUser()` in both `web/app/api/deployments/route.ts` and `web/app/api/my-deployments/route.ts`, parsed in `functions/src/functions/processDeployment.ts`, and applied in `bicep-executor.ts`. Until admin provides App Registration credentials (`AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`), the placeholder login stub (`demo@sandbox.local`) remains active via `GET /api/auth/login`.

---

## Architecture — How Deployments Work

1. User submits → `POST /api/deployments` rate-limits (429 if the global 20/hour cap is hit), validates policy (403 if slug/resource-type is blocked), generates a `submissionId` (UUID), derives resource group name, enqueues a message. Returns `{ submissionId, resourceGroup }`.
2. Azure Function App picks up the queue message, creates the resource group with 6 tags, runs the ARM deployment with 4 policy tags applied to every resource.
3. **No visible progress UI.** `ConfirmModal` shows only the proof artifact — a Submitted/Deploying/Complete timeline was deliberately removed (commit `1f4ca28`, 2026-05-15) because it was misleading: HOD approval and admin role assignment happen entirely outside this system, so implying an in-app "Deploying" step didn't match reality. Instead, `review/page.tsx` runs a **silent background poll** (`getDeployment()`, every 3 s, up to ~5 min) against `GET /api/deployments/:id?rg=<rgName>` — it produces no visible change unless the deployment actually fails, in which case a single error toast appears. Succeeding, or still being in progress, stays invisible. This poll is page-scoped: navigating away from `/review` stops it (no app-wide notification persistence yet).
4. `GET /api/deployments/:id` returns `"accepted"` whenever the RG doesn't exist yet — but first checks the failure-record blob (written by the poison-queue handler *and* by a malformed/Zod-rejected queue message) so a deployment that failed before the RG was ever created is reported `"failed"`, not stuck at `"accepted"` forever.
5. `GET /api/my-deployments` queries ARM for resource groups tagged `deployedBy: demo@sandbox.local` (no dedicated UI page currently).

**ARM tags — resource group gets 6 tags; ARM resources get 4 policy tags only:**
- Policy-required (on RG + every resource): `Cost Center`, `Project ID`, `Project Owner`, `Expiry Date`
- App-added (RG only): `deployedBy` (user identity stub), `iac-submissionId` (for status back-lookup, and the proof that a given RG was created by this app — see Resource Group Lifecycle below)

**Error handling in Function App:**
- Zod validation failure → logs, writes a best-effort failure record (if `submissionId` is present on the raw message), and returns — no retry, the message is malformed and will never succeed
- ARM/executor errors → thrown (not caught) so the Functions runtime retries (`host.json` `maxDequeueCount: 3`) and eventually poison-queues
- Poison-queue handler (`processPoisonDeployment.ts`) writes a failure record, then auto-deletes the resource group — a poisoned message means the ARM deployment PUT never succeeded, so the RG (if it even exists) never received a working deployment; nothing valuable is ever discarded

## Resource Group Lifecycle

Two automated mechanisms reclaim resource groups this app created — both gated on the presence of the app's own `iac-submissionId` tag, so neither ever touches a resource group it didn't create, even elsewhere in a shared subscription:

- **Orphan cleanup** — `processPoisonDeployment.ts` deletes the RG immediately when a deployment permanently fails (see above).
- **Expiry reaper** — `functions/src/functions/reapExpiredDeployments.ts`, a daily timer function (03:00 UTC), deletes any RG whose `Expiry Date` tag has passed. Report-only was considered and rejected in favor of real deletion (see HANDOFF.md for the decision).

**Rate limiting:** `web/lib/deployments/rate-limit.ts` enforces a global rolling-window cap (20 submissions/hour) via a single blob with ETag optimistic concurrency in the existing storage account. Fails open on any storage error — a rate-limiter outage must never block legitimate deployments. Global, not per-user, because auth is still the shared placeholder identity (see SSO status).

---

## Template Catalog

2 templates, automation category only. `approval-workflow`, `scheduled-automation`, and `static-web-app` pulled from the catalog for now — see `.claude/rules/templates.md` for reversal steps. Region is locked to Malaysia West only — no region choice in any wizard.

| Category | Slug | Resource Type | Count |
|----------|------|---------------|-------|
| automation | `logic-app` | Logic App | 1 |
| automation | `logic-app-storage` | Logic App + Storage Account | 2 |

Deployable slugs (allow-list in `web/lib/deployments/policy.ts`):
- `logic-app`, `logic-app-storage`

---

## Tech Stack

### Web App (`web/`)
- **Framework:** Next.js 16 — App Router with Route Handlers
- **Language:** TypeScript strict mode (no `any`)
- **Styling:** Tailwind CSS v4 with CSS variable design tokens
- **State:** Zustand — single `deploymentStore` for all cross-route state
- **Forms:** React Hook Form + Zod (`buildSchema` in `lib/schema.ts`)
- **Icons:** Lucide React (`getIcon` in `lib/icons.ts`)
- **Animations:** Framer Motion (reduced-motion safe)
- **Testing:** Vitest + React Testing Library
- **Queue:** `@azure/storage-queue` for async ARM dispatch
- **ARM:** `@azure/arm-resources` + `@azure/identity` (`DefaultAzureCredential`) for status polling and RG listing

### Azure Functions (`functions/`)
- Node.js 22 LTS, TypeScript, Azure Functions v4 SDK
- Queue-triggered `processDeployment` — creates tagged resource group, deploys ARM template via managed identity
- Queue-triggered `processPoisonDeployment` — writes failure record, deletes the orphaned RG
- Timer-triggered `reapExpiredDeployments` — daily, deletes RGs past their `Expiry Date` tag (app-owned RGs only)
- ARM builders: Storage, KeyVault, VNet, SQL, Logic App (HTTP + recurrence), Service Bus, Event Grid

### No database
Prisma and PostgreSQL have been removed. ARM is the source of truth for all deployment state.

> NPM dependency lists: see `.claude/rules/dependencies.md` — auto-loads when editing `package.json`.

---

## Directory Layout

```
/
├── web/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Home (/)
│   │   ├── login/               # /login — placeholder login
│   │   ├── templates/           # /templates and /templates/[slug]
│   │   ├── review/              # /review
│   │   └── api/
│   │       ├── deployments/         # POST create (validates policy → 403 if blocked)
│   │       │   └── [submissionId]/  # GET status (ARM, requires ?rg= param)
│   │       ├── my-deployments/      # GET list RGs by deployedBy tag
│   │       ├── auth/                # POST login (stub), POST logout, GET callback (MSAL), GET me
│   │       └── healthz/
│   ├── components/
│   │   ├── layout/   # Navbar, Breadcrumb, Footer, PageTransition, UserMenu, PageEyebrow, MainShell, AmbientBackground
│   │   ├── ui/       # Button, Card, Badge, Modal, Toast, MonoSectionHeader, DocumentDivider, Logo, AsciiTerminal, BracketFeature, ComparisonBar, DynamicIcon, FaqAccordion, MarqueeStrip, NumberedBlock, StatusIndicator
│   │   ├── templates/# TemplateRow, FilterPills
│   │   ├── wizard/   # Stepper, WizardStep, SummaryPanel
│   │   ├── review/   # ReviewSection, ConfirmModal (proof artifact only — no progress timeline, see Architecture)
│   │   └── home/     # NavLink, TerminalHero
│   ├── store/
│   │   └── deploymentStore.ts   # mode: "template"|"custom"; wizard state, submission tracking
│   ├── lib/
│   │   ├── api.ts               # Client-side fetch helpers
│   │   ├── arm.ts               # getArmClient() factory
│   │   ├── auth-core.ts         # Edge-safe cookie signing/verification
│   │   ├── auth.ts              # Server-side auth helpers
│   │   ├── button-classes.ts    # Tailwind button class builder
│   │   ├── display.ts           # displayFieldValue() for proof artifacts
│   │   ├── env-public.ts        # Public env var reader
│   │   ├── errors.ts            # AppError (incl. forbidden()), toErrorResponse()
│   │   ├── icons.ts             # Lucide icon map + getIcon()
│   │   ├── modal-inert.ts       # Inert management for modals
│   │   ├── motion.ts            # Shared Framer Motion variants
│   │   ├── msal.ts              # MSAL/Entra ID config (on hold)
│   │   ├── report.ts            # generateReport() — proof artifact
│   │   ├── schema.ts            # buildSchema() — Zod form schemas
│   │   ├── server-env.ts        # Zod env (no DATABASE_URL)
│   │   ├── utils.ts             # cn() utility
│   │   └── deployments/
│   │       ├── schema.ts        # Zod payload schemas + tagsSchema
│   │       ├── deployment.schema.test.ts  # schema unit tests (co-located)
│   │       ├── policy.ts        # DEPLOYABLE_SLUGS allow-list + ALLOWED_RESOURCE_TYPES (scoped to what buildCustomResources supports)
│   │       ├── failure-lookup.ts # Reads failure blobs from storage
│   │       ├── rg-name.ts       # deriveResourceGroupName / deriveLocation
│   │       ├── rate-limit.ts    # checkAndRecordSubmission() — global 20/hour cap, blob + ETag concurrency
│   │       └── arm-status.ts    # mapArmProvisioningState → DeploymentStatus
│   ├── types/index.ts           # Shared frontend types — does NOT export DeploymentPayload (use @/lib/deployments/schema)
│   ├── data/
│   │   └── templates.json       # 2 templates, automation category only (approval-workflow, scheduled-automation, static-web-app pulled for now); region locked to malaysiawest only
│   └── __tests__/
│       ├── store/
│       ├── lib/deployments/
│       ├── store/
│       ├── lib/
│       │   └── deployments/
│       ├── components/
│       │   └── layout/
│       └── app/
│           ├── api/
│           │   ├── auth/
│           │   ├── deployments/
│           │   └── my-deployments/
│           ├── review/
│           └── login/
│
├── functions/
│   └── src/
│       ├── functions/processDeployment.ts        # Queue-triggered handler; errors thrown for retry
│       ├── functions/processPoisonDeployment.ts  # Poison-queue dead-letter handler — writes failure record, deletes the orphaned RG
│       ├── functions/reapExpiredDeployments.ts   # Daily timer (03:00 UTC) — deletes RGs past Expiry Date, only ones tagged iac-submissionId
│       ├── functions/healthz.ts                  # HTTP health check endpoint
│       ├── lib/env.ts
│       └── modules/deployments/
│           ├── arm-template-builder.ts      # Builders + PolicyBlockedTemplateError
│           ├── bicep-executor.ts            # Applies 6 tags to RG, 4 policy tags to ARM resources
│           ├── deployment.schema.ts         # Deployment payload schemas + deploymentJobMessageSchema (queue message contract)
│           ├── failure-store.ts             # Writes failure records to blob storage
│           └── sanitize.ts                  # Name sanitization helpers
│       └── __tests__/
│           ├── functions/
│           │   ├── processDeployment.test.ts
│           │   ├── processPoisonDeployment.test.ts
│           │   ├── reapExpiredDeployments.test.ts
│           │   └── healthz.test.ts
│           └── modules/deployments/
│               ├── arm-template-builder.test.ts
│               ├── bicep-executor.test.ts
│               └── sanitize.test.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml               # Single workflow; web + functions jobs run in parallel, plus an always-run schema-drift job (not path-filter-gated)
│
├── docs/
│   ├── project/                 # Permanent project reference (READ-ONLY)
│   │   ├── SPEC.md
│   │   └── API_SPEC_OPENAPI.yaml
│   └── superpowers/
│       ├── specs/               # Active design specs
│       ├── plans/               # Active implementation plans
│       └── archive/             # Completed plans + superseded specs + retired skills
└── .claude/                     # Claude Code config (project scope, ships with repo)
    ├── agents/                  # subagent definitions (Task tool spawns these)
    ├── skills/                  # project skills
    ├── rules/                   # path-scoped instruction files (auto-load by glob)
    ├── hooks/                   # lifecycle scripts (secret-leak guard, session banner)
    ├── settings.json            # permissions + hook wiring (committed)
    └── settings.local.json      # personal permissions (gitignored)
```

---

## Development Commands

```sh
# Run from web/ — prefix with NODE_OPTIONS for corporate SSL
$env:NODE_OPTIONS="--use-system-ca"; npm run dev   # Start dev server (localhost:3000)
npm run build
npm start
npm run lint              # must pass with 0 errors
npx vitest run            # run full test suite — MUST run from web/ (not repo root)
npx vitest run "SomeFile" # run a single test file by name
npx tsc --noEmit          # must pass with 0 errors (npm run type-check does not exist)

# Run from functions/ for functions tests
npx vitest run            # MUST run from functions/ (not repo root)
```

No docker-compose or local database needed.

---

## Canonical Patterns (enforce these)

| Pattern | Location |
|---------|----------|
| Tag validation | `tagsSchema.safeParse()` from `web/lib/deployments/schema.ts` |
| Field display | `displayFieldValue(field, value)` from `web/lib/display.ts` |
| RG name | `deriveResourceGroupName` / `sanitise` from `web/lib/deployments/rg-name.ts` |
| ARM status | `mapArmProvisioningState` from `web/lib/deployments/arm-status.ts` |
| ARM client | `getArmClient()` from `web/lib/arm.ts` (one per request) |
| Server env | `serverEnv` from `web/lib/server-env.ts` (never raw `process.env`) |
| Client API | helpers in `web/lib/api.ts` (never raw `fetch('/api/...')`) — `submitDeployment`, `getDeployment`, `getMe`, `logoutUser` |
| Errors | `AppError` + `toErrorResponse()` from `web/lib/errors.ts`; use `AppError.forbidden()` for policy blocks |
| Schema sync | `functions/src/modules/deployments/deployment.schema.ts` must match `web/lib/deployments/schema.ts` — edit both together. Also exports `deploymentJobMessageSchema` + `DeploymentJobMessage` (queue message contract — single source of truth) |
| Policy check | `DEPLOYABLE_SLUGS` in `web/lib/deployments/policy.ts` — add new slugs here when adding templates |
| Payload type | `DeploymentPayload` from `@/lib/deployments/schema` (Zod-inferred, authoritative) — NOT from `@/types` |
| Rate limiting | `checkAndRecordSubmission()` from `web/lib/deployments/rate-limit.ts` — call after auth + policy checks pass, before enqueue |

---

## Error Response Contract

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "path": "template.slug", "message": "Required" }]
  },
  "requestId": "req_abc123"
}
```

---

## Coding Conventions

- TypeScript strict mode — no `any`, no unguarded type assertions
- Validate all input with Zod at API boundaries
- State via Zustand only — no component-local state for cross-route data
- No database — ARM is source of truth; no Prisma, no SQL
- Structured logs — include `requestId`, `submissionId` (backend routes)
- No secrets in code or logs — env vars / managed identity only
- Accessibility built-in — ARIA labels, `role=dialog`, `aria-invalid`, keyboard support
- Tests co-located where practical — `Component.test.tsx` next to component; `__tests__/` for lib/store

---

## Git and Branch Strategy

- `main` — production-ready; CI deploys to Azure App Service on every push
- Feature branches: `feature/<scope>`
- Use git worktrees (`.worktrees/`) for isolated feature work
- Push requires `GIT_SSL_NO_VERIFY=true` (corporate TLS interception)

```
feat: add my-stuff page listing ARM resource groups
fix: prevent duplicate resource types in builder
chore: remove Prisma and DATABASE_URL
```

---

## Quality Gates

```sh
# web/
npm run lint         # 0 errors
npx tsc --noEmit     # 0 errors
npx vitest run       # all pass
npm run build        # .next/ produced

# functions/
npx tsc --noEmit     # 0 errors
npx vitest run       # all pass
```

---

## Gotchas

- `npm run test --run` prints "Unknown cli config" warning — use `npx vitest run` instead
- `npm run type-check` does not exist — use `npx tsc --noEmit`
- Do not call `setState()` directly inside `useEffect` — triggers `react-hooks/set-state-in-effect` ESLint error; use CSS animations (`animate-fade-in` utility in globals.css) instead
- Subagent `general-purpose` (haiku) cannot execute Bash file deletions — handle `rm` commands in the controller session directly
- Functions errors must propagate (not be swallowed) so the runtime can retry and poison-queue bad messages
- When adding a new deployable template slug, update BOTH `web/lib/deployments/policy.ts` (DEPLOYABLE_SLUGS) AND `web/lib/deployments/rg-name.ts` (primary field map)
- `functions/package.json` `main` must be `dist/functions/*.js` — tsconfig `rootDir: ./src` strips the `src/` prefix, so compiled output is at `dist/functions/`, not `dist/src/functions/`. Getting this wrong causes "Function host is not running"
- Function App Azure settings: `AZURE_SUBSCRIPTION_ID` must point to `sub-epf-sandbox-internal` (`1fed33d2-00fd-40a8-a5c1-c120aec1b902`), not the cloud sub. Managed identity needs Contributor on that subscription.
- Both RG-deleting code paths (`processPoisonDeployment.ts`, `reapExpiredDeployments.ts`) gate strictly on the presence of the app's own `iac-submissionId` tag before ever calling `beginDelete` — never remove that guard, it's the only thing preventing either from touching a resource group this app didn't create in a shared subscription
- The review page's status poll (`review/page.tsx`) is deliberately silent unless the deployment fails — do not reintroduce a visible Submitted/Deploying/Complete timeline without checking `HANDOFF.md` first; it was removed once already (commit `1f4ca28`) for a documented product reason

> Template catalog (2 templates, no policy-blocked slugs, region lock): see `.claude/rules/templates.md` — auto-loads when editing templates/data/deployments files.  
> Design tokens and color values: see `.claude/rules/design-system.md` — auto-loads when editing any `web/` file.  
> Proof artifact exact format: see `.claude/rules/proof-format.md` — auto-loads when editing review components or `report.ts`.
