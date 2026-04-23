# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
5. `web/server.js` deletes the `HOSTNAME` env var, then calls `startServer` from `next/dist/server/lib/start-server` bound to `0.0.0.0`

> `next.config.js` uses `output: 'standalone'`. The custom `server.js` **must** use `startServer` from `next/dist/server/lib/start-server` — **not** the public programmatic API (`require('next')`). The programmatic API is incompatible with standalone output and will fail at runtime.
> Do NOT switch back to the programmatic API (`next({ dev: false, dir })`). It does not work with the standalone build artifact.

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
│   │   ├── login/               # /login — deferred (pending MSAL credentials)
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
├── docs/superpowers/plans/      # Implementation plans
├── implementation/              # Frozen specs (READ-ONLY)
│   ├── SPEC.md
│   └── API_SPEC_OPENAPI.yaml
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

### Color Tokens (Dark Theme — default)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#0a0a0a` | Page background |
| `--color-surface` | `#111111` | Card backgrounds |
| `--color-surface-elevated` | `#1a1a1a` | Modals, drawers |
| `--color-border` | `rgba(255,255,255,0.08)` | Borders |
| `--color-text` | `#f0f0f0` | Primary text |
| `--color-text-muted` | `rgba(255,255,255,0.5)` | Secondary text |
| `--color-accent` | `#0078d4` | Azure blue |
| `--color-accent-hover` | `#1a8fe8` | Accent hover |
| `--color-error` | `#ef4444` | Errors |
| `--color-success` | `#22c55e` | Success |
| `--color-warning` | `#f59e0b` | Warnings |

### Color Tokens (Light Theme — `html[data-theme='light']`)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#fafafa` | Page background |
| `--color-surface` | `#ffffff` | Cards |
| `--color-border` | `rgba(0,0,0,0.08)` | Borders |
| `--color-text` | `#171717` | Primary text |
| `--color-text-muted` | `rgba(0,0,0,0.5)` | Secondary text |
| `--color-accent` | `#0078d4` | Azure blue |
| `--color-accent-hover` | `#005a9e` | Accent hover |
| `--color-error` | `#dc2626` | Errors |
| `--color-success` | `#16a34a` | Success |
| `--color-warning` | `#d97706` | Warnings |

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
- `lucide-react`, `framer-motion`, `geist`

### `web/` — Development
- `typescript`, `@types/react`, `@types/react-dom`, `@types/node`
- `tailwindcss` (v4), `eslint`, `eslint-config-next`
- `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`
- `msw`, `jsdom`

### `functions/` — Production
- `@azure/functions` (v4), `@azure/arm-resources`, `@azure/identity`, `zod`
