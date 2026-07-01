# CLAUDE.md — Project Conventions & Developer Guidance

> **Version:** 2.5.2 | **Last updated:** 2026-07-01 | **Status:** Active  
> **Purpose:** Single source of truth for project conventions, tech stack, and development patterns  
> **Owner:** All engineers | **Review cadence:** On every convention or pattern change  
> **Related docs:** [Documentation Index](docs/README.md) | [Complete Spec](docs/project/SPEC.md) | [Glossary](docs/GLOSSARY.md) | [HANDOFF](docs/superpowers/HANDOFF.md)

---

## Session Context — Read This First

**MANDATORY: Every session must start by reading this file in full before taking any action.** This is the single source of truth for project state, conventions, and what is live vs blocked. Do not rely on memory or prior-session assumptions — read this file, then act.

> **If continuing from a prior session (especially on a new device), read [`docs/superpowers/HANDOFF.md`](docs/superpowers/HANDOFF.md) immediately after this file.** It captures the open PR state, what was done last, and what's next.

Before starting any work, check `docs/superpowers/specs/` for any active (non-archived) specs that have been designed but not yet implemented.

No active specs or plans. All approved work is implemented; completed designs live under `docs/superpowers/archive/`.

**What is live and working:** Terminal-native document redesign (mono nav chrome, editorial rows, `~/path` eyebrows); supporting-resource bundling (LAW + KV auto-injected into every deployment); see Live Deployment section below.  
**Latest session (2026-07-01):** Codebase optimization pass — policy sync fix, queue message schema extracted to single source, `DeploymentPayload` type now Zod-only, `getMe()` added to api.ts, `templates.md` corrected. 239 web + 74 functions tests passing. See HANDOFF.md for full change list.
**What is designed but not built:** Nothing — all approved specs implemented.
**SSO status:** Microsoft SSO / MSAL is **on hold** — placeholder login is live and sufficient for current needs. The MSAL plumbing is fully implemented but not being activated at this time. See Authentication section.
**What needs admin action:** Configure `epf-sandbox-functions` environment variables in Azure Portal (`DEPLOYMENT_QUEUE`, `AZURE_STORAGE_CONNECTION_STRING`, `AzureWebJobsStorage`, `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`) so the Function App can consume queue messages. Managed identity setup is complete: App Service MI has **Reader** on `sub-epf-sandbox-internal`, Function App MI has **Contributor** on `sub-epf-sandbox-internal`. After env vars are set, verify end-to-end with a test deployment (e.g., Storage Account) and confirm the resource group appears in `sub-epf-sandbox-internal` with all 6 ARM tags.

---

## Project Overview

**Sandbox IAC** is an Azure Infrastructure-as-Code deployment platform for EPF (Employees Provident Fund, Malaysia). It lets non-expert users configure and submit Azure infrastructure deployments through the Template Flow:

- **Template Flow** — Multi-step wizard using predefined templates (3 templates across 2 categories)

The Template flow converges at a shared Review & Submit page, calling `POST /api/deployments`. After submission, a copyable plain-text proof artifact is generated for manual HOD approval. Deployment status is tracked via Azure ARM — ARM is the source of truth (no database).

> **Note:** The Custom Builder and Custom Request flows have been removed. Only the Template flow is currently active.

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

Identity comes from `getCurrentUser()` in `web/lib/auth.ts`. Today this reads an HMAC-signed session cookie (`iac_session`, Web Crypto SHA-256, 24 h TTL) and returns the placeholder user `{ upn: "demo@sandbox.local", displayName: "Demo User" }`. The cookie is created by `POST /api/auth/login` (clicked via the stub "Sign in with Microsoft" button) and cleared by `POST /api/auth/logout`.

The core cookie signing/verification logic lives in `web/lib/auth-core.ts`, which is Edge-safe and used by `proxy.ts` (avoids importing `next/headers` in the middleware layer).

**MSAL swap:** MSAL plumbing is fully implemented — authorization code + PKCE flow at `web/lib/msal.ts`, GET redirect login at `GET /api/auth/login`, and OAuth callback handler at `GET /api/auth/callback`. `deployedBy` is wired end-to-end: session → queue message → ARM tags via `getCurrentUser()` in both `web/app/api/deployments/route.ts` and `web/app/api/my-deployments/route.ts`, parsed in `functions/src/functions/processDeployment.ts`, and applied in `bicep-executor.ts`. Until admin provides App Registration credentials (`AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`), the placeholder login stub (`demo@sandbox.local`) remains active via `POST /api/auth/login`.

---

## Architecture — How Deployments Work

1. User submits → `POST /api/deployments` validates policy (returns 403 if slug is blocked), generates a `submissionId` (UUID), derives resource group name, enqueues a message. Returns `{ submissionId, resourceGroup }`.
2. Azure Function App picks up the queue message, creates the resource group with 6 tags, runs the ARM deployment with 4 policy tags applied to every resource.
3. Review page polls `GET /api/deployments/:id?rg=<rgName>` every 3 s — queries ARM directly for deployment status. Returns `"accepted"` if the ARM deployment does not exist yet (still queued).
4. `GET /api/my-deployments` queries ARM for resource groups tagged `deployedBy: demo@sandbox.local` (no dedicated UI page currently).
5. On `succeeded`, ConfirmModal shows a "View in Azure Portal" deep-link to the resource group in `sub-epf-sandbox-internal`.

**ARM tags — resource group gets 6 tags; ARM resources get 4 policy tags only:**
- Policy-required (on RG + every resource): `Cost Center`, `Project ID`, `Project Owner`, `Expiry Date`
- App-added (RG only): `deployedBy` (user identity stub), `iac-submissionId` (for status back-lookup)

**Status timeline (ConfirmModal — 3 steps):**
- `accepted` → Submitted (active)
- `running` → Deploying (active)
- `succeeded` / `failed` → Complete (active or failed state)

**Error handling in Function App:**
- Zod validation failure → logs and returns (no retry, message is malformed)
- ARM/executor errors → thrown (not caught) so the Functions runtime retries and eventually poison-queues

---

## Template Catalog

3 templates across 2 categories (automation, compute). All region options are locked to:
- Malaysia (Malaysia West) — default
- Asia Pacific (Southeast Asia)

| Category | Slug | Resource Type | Count |
|----------|------|---------------|-------|
| automation | `approval-workflow` | Logic App | 1 |
| automation | `scheduled-automation` | Logic App | 1 |
| compute | `static-web-app` | Static Web App | 1 |

Deployable slugs (allow-list in `web/lib/deployments/policy.ts`):
- `approval-workflow`, `scheduled-automation`, `static-web-app`

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
│   │   ├── review/   # ReviewSection, ConfirmModal (mono glyph timeline + portal deep-link)
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
│   │       ├── policy.ts        # DEPLOYABLE_SLUGS allow-list + ALLOWED_RESOURCE_TYPES
│   │       ├── failure-lookup.ts # Reads failure blobs from storage
│   │       ├── rg-name.ts       # deriveResourceGroupName / deriveLocation
│   │       └── arm-status.ts    # mapArmProvisioningState → DeploymentStatus
│   ├── types/index.ts           # Shared frontend types — does NOT export DeploymentPayload (use @/lib/deployments/schema)
│   ├── data/
│   │   ├── templates.json       # 3 templates across 2 categories; regions locked to malaysiawest/southeastasia only
│   │   └── resources.json       # 10 resource types for Custom Builder flow
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
│       ├── functions/processPoisonDeployment.ts  # Poison-queue dead-letter handler
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
│           │   └── healthz.test.ts
│           └── modules/deployments/
│               ├── arm-template-builder.test.ts
│               ├── bicep-executor.test.ts
│               └── sanitize.test.ts
│
├── .github/
│   └── workflows/
│       └── ci.yml               # Single workflow; web + functions jobs run in parallel
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

> Template catalog (16 templates, policy-blocked slugs, region lock): see `.claude/rules/templates.md` — auto-loads when editing templates/data/deployments files.  
> Design tokens and color values: see `.claude/rules/design-system.md` — auto-loads when editing any `web/` file.  
> Proof artifact exact format: see `.claude/rules/proof-format.md` — auto-loads when editing review components or `report.ts`.
