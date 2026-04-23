# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Session Context — Read This First

Before starting any work, read the active specs in `docs/superpowers/specs/` to understand what has been designed but not yet implemented.

| Spec | Status | Summary |
|------|--------|---------|
| `docs/superpowers/specs/2026-04-23-refactor-cleanup-design.md` | **Designed — not yet implemented** | 4-phase refactor: deps, cleanup, tests, observability |
| `docs/superpowers/specs/2026-04-23-ui-redesign-design.md` | **Designed — not yet implemented** | Full UI/UX redesign: IBM Plex fonts, soft blue-gray palette, top nav, 4 new templates, nice-to-haves |

**What is live and working:** See Live Deployment section below.
**What is designed but not built:** The two specs above.
**What is blocked:** Microsoft SSO / MSAL (pending admin App Registration credentials).

---

## Project Overview

**Sandbox IAC** is an Azure Infrastructure-as-Code deployment platform for EPF (Employees Provident Fund, Malaysia). It lets non-expert users configure and submit Azure infrastructure deployments through two guided flows:

- **Template Flow** — Multi-step wizard using predefined templates (8 templates)
- **Custom Builder Flow** — Resource-by-resource configuration builder

Both flows converge at a shared Review & Submit page, calling `POST /api/deployments`. After submission, a copyable plain-text proof artifact is generated for manual HOD approval. Deployment status is tracked via Azure ARM — ARM is the source of truth (no database).

**Microsoft SSO (Entra ID / MSAL.js)** is a planned requirement but is currently blocked on admin providing App Registration credentials. Until then, `deployedBy` is hardcoded to `"demo@sandbox.local"`.

---

## Live Deployment

**URL:** `https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net`

**Infrastructure:**
- Azure App Service (Linux, Node 22, B1 SKU) — runs `node server.js` (Next.js standard build output)
- Azure Storage Queue: `deployment-jobs` in storage account `coeiacsandbox8bfc`
- Azure Function App: `epf-sandbox-functions` (queue-triggered ARM deployments)

**App Service env vars (required):**
| Variable | Purpose |
|----------|---------|
| `AZURE_SUBSCRIPTION_ID` | Azure subscription (`1fed33d2-00fd-40a8-a5c1-c120aec1b902`) |
| `AZURE_TENANT_ID` | Azure tenant ID (`3335e1a2-2058-4baf-b03b-031abf0fc821`) |
| `AZURE_STORAGE_CONNECTION_STRING` | Storage account connection string for queue |

**CI/CD deploy approach (`web.yml`):**
1. `npm ci` → lint → type-check → test → `npm run build` (with dummy env vars)
2. Assemble standalone release: copy `public/` and `.next/static/` into `.next/standalone/`, copy `server.js`, write `oryx-manifest.toml`
3. Zip `.next/standalone/` → `release.zip` and deploy via `azure/webapps-deploy@v3`
4. App Service runs `node server.js` (declared in `oryx-manifest.toml` as `StartupFileName`)
5. The CI workflow patches the auto-generated `.next/standalone/server.js` with `sed` to prepend `process.env.HOSTNAME = "0.0.0.0"` — Azure sets `HOSTNAME` to the container's internal hostname, which would make Next.js bind to the wrong interface and fail the nginx health check.

> `next.config.js` uses `output: 'standalone'`. The CI workflow patches the auto-generated standalone `server.js` directly — it does **not** copy `web/server.js` into the standalone package. Do not add `cp server.js .next/standalone/server.js` back to the workflow; it replaced the correct standalone server with an incompatible programmatic-API server.
> `web/server.js` is kept for local `npm start` use only (programmatic API + explicit `0.0.0.0` bind). It is not deployed to Azure.

---

## Architecture — How Deployments Work

1. User submits → `POST /api/deployments` generates a `submissionId` (UUID), derives resource group name, enqueues a message. Returns `{ submissionId, resourceGroup }`.
2. Azure Function App picks up the queue message, creates the resource group (tagged with `deployedBy` and `iac-submissionId`), runs the ARM deployment using `submissionId` as the ARM deployment name.
3. Review page polls `GET /api/deployments/:id?rg=<rgName>` every 3 s — queries ARM directly for deployment status. Returns `"accepted"` if the ARM deployment does not exist yet (still queued).
4. "My Stuff" page calls `GET /api/my-deployments` — queries ARM for resource groups tagged `deployedBy: demo@sandbox.local`.

**ARM tags on every resource group:**
- Policy-required: `Cost Center`, `Project ID`, `Project Owner`, `Expiry Date`
- App-added by Function: `deployedBy` (user identity stub), `iac-submissionId` (for status back-lookup)

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

### No database
Prisma and PostgreSQL have been removed. ARM is the source of truth for all deployment state.

---

## Directory Layout

```
/
├── web/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Home (/)
│   │   ├── login/               # /login — removed (MSAL blocked; page deleted in UI redesign)
│   │   ├── templates/           # /templates and /templates/[slug]
│   │   ├── builder/             # /builder
│   │   ├── review/              # /review
│   │   ├── my-stuff/            # /my-stuff — user's deployed resource groups
│   │   └── api/
│   │       ├── deployments/         # POST create
│   │       │   └── [submissionId]/  # GET status (ARM, requires ?rg= param)
│   │       ├── my-deployments/      # GET list RGs by deployedBy tag
│   │       └── healthz/
│   ├── components/
│   │   ├── layout/   # PageShell, Sidebar, Topbar, ThemeToggle
│   │   ├── ui/       # Button, Card, Badge, Modal, Toast
│   │   ├── templates/
│   │   ├── wizard/
│   │   ├── builder/
│   │   └── review/
│   ├── store/
│   │   └── deploymentStore.ts   # includes deployedResourceGroup field
│   ├── lib/
│   │   ├── api.ts               # Client-side fetch helpers
│   │   ├── arm.ts               # getArmClient() factory
│   │   ├── errors.ts
│   │   ├── server-env.ts        # Zod env (no DATABASE_URL)
│   │   ├── schema.ts
│   │   ├── icons.ts
│   │   ├── report.ts
│   │   └── deployments/
│   │       ├── schema.ts        # Zod payload schemas + tagsSchema
│   │       ├── rg-name.ts       # deriveResourceGroupName / deriveLocation
│   │       └── arm-status.ts    # mapArmProvisioningState → DeploymentStatus
│   ├── types/index.ts
│   ├── data/
│   │   ├── templates.json
│   │   └── resources.json
│   └── __tests__/
│       ├── store/
│       ├── lib/deployments/     # arm-status.test.ts
│       └── app/
│           ├── review/
│           └── my-stuff/
│
├── functions/
│   └── src/
│       ├── functions/processDeployment.ts
│       ├── lib/env.ts
│       └── modules/deployments/
│           ├── arm-template-builder.ts
│           ├── bicep-executor.ts   # tags RG with deployedBy + iac-submissionId
│           ├── deployment.schema.ts
│           └── rg-name.ts
│
├── docs/
│   ├── project/                 # Permanent project reference (READ-ONLY)
│   │   ├── SPEC.md
│   │   └── API_SPEC_OPENAPI.yaml
│   └── superpowers/
│       ├── specs/               # Active design specs
│       ├── plans/               # Active implementation plans
│       └── archive/             # Completed plans + superseded specs
├── workflows/                   # Claude Code agents + skills (source of truth)
│   ├── agents/
│   ├── skills/
│   └── README.md
└── scripts/
    └── install-workflows.sh     # copies workflows/ into .claude/
```

---

## Development Commands

```sh
# Run from web/ — prefix with NODE_OPTIONS for corporate SSL
$env:NODE_OPTIONS="--use-system-ca"; npm run dev   # Start dev server (localhost:3000)
npm run build
npm start
npm run lint         # must pass with 0 errors
npm run test:run     # must all pass
npx tsc --noEmit     # must pass with 0 errors

# Run a single test file
npx vitest run path/to/Component.test.tsx
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
| Client API | helpers in `web/lib/api.ts` (never raw `fetch('/api/...')`) |
| Errors | `AppError` + `toErrorResponse()` from `web/lib/errors.ts` |

---

## Design System

> **Active spec:** `docs/superpowers/specs/2026-04-23-ui-redesign-design.md`
> Font: IBM Plex Sans + IBM Plex Mono. Light mode is default. Dark mode via toggle.

### Color Tokens (Light Theme — default)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#edf1f7` | Page background (soft blue-gray) |
| `--color-surface` | `#f8fafd` | Card backgrounds |
| `--color-surface-elevated` | `#ffffff` | Modals, popovers |
| `--color-border` | `#d4dce8` | Borders |
| `--color-border-strong` | `#b0c0d8` | Strong borders |
| `--color-text` | `#1e3148` | Primary text (deep navy) |
| `--color-text-muted` | `#5a7290` | Secondary text |
| `--color-primary` | `#1e3a5f` | Buttons, active states |
| `--color-primary-hover` | `#163050` | Primary hover |
| `--color-accent` | `#2b7fd4` | Links, highlights (Azure blue) |
| `--color-error` | `#c0392b` | Errors |
| `--color-success` | `#2e7d52` | Success |
| `--color-warning` | `#9a6110` | Warnings |

### Color Tokens (Dark Theme — `html[data-theme='dark']`)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#1a2535` | Page background |
| `--color-surface` | `#243044` | Card backgrounds |
| `--color-surface-elevated` | `#2e3d58` | Modals, popovers |
| `--color-border` | `rgba(44,127,212,0.18)` | Borders |
| `--color-text` | `#d8e4f0` | Primary text |
| `--color-text-muted` | `rgba(160,190,225,0.75)` | Secondary text |
| `--color-primary` | `#2b7fd4` | Buttons, active states |
| `--color-accent` | `#4a9be0` | Links, highlights |
| `--color-error` | `#ef4444` | Errors |
| `--color-success` | `#22c55e` | Success |
| `--color-warning` | `#f59e0b` | Warnings |

---

## Proof Artifact Format

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
npm run test:run     # all pass
npm run build        # .next/ produced

# functions/
npx tsc --noEmit     # 0 errors
```

---

## NPM Dependencies

### `web/` — Production
- `next` (v16), `react`, `react-dom` (v19)
- `@azure/storage-queue`, `@azure/arm-resources`, `@azure/identity`
- `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod`
- `lucide-react`, `framer-motion` (fonts: IBM Plex Sans + IBM Plex Mono via `next/font/google`)

### `web/` — Development
- `typescript`, `@types/react`, `@types/react-dom`, `@types/node`
- `tailwindcss` (v4), `eslint`, `eslint-config-next`
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `msw`, `jsdom`

### `functions/` — Production
- `@azure/functions` (v4), `@azure/arm-resources`, `@azure/identity`, `zod`
