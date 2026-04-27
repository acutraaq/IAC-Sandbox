# Sandbox Azure Deployer — Complete Specification

> **Version:** v2.0.0 | **Last updated:** 2026-04-22 | **Status:** Active  
> **Owner:** Product + Architecture | **Review cadence:** Quarterly or on breaking changes  
> **Related docs:** [Project Index](../README.md) | [API Spec](API_SPEC_OPENAPI.yaml) | [Glossary](../GLOSSARY.md) | [CLAUDE.md](../../CLAUDE.md)
>
> This is the single source of truth for the entire project. Sections marked **[v2]** were updated to match what was actually built. The original v1.2.0 plan (Fastify + PostgreSQL separate backend) was superseded — see ADR-016 through ADR-019 in Section 14 for the decisions that changed the architecture.

---

## Quick Navigation

**By role:** [For Product Managers](../README.md#for-product-managers--business-stakeholders) | [For Engineers](../README.md#for-engineers--developers) | [For DevOps](../README.md#for-devops--platform-teams) | [For Security](../README.md#for-security--compliance)

**In this document:** [Executive Summary](#1-executive-summary) | [Architecture](#7-frontend-architecture) | [API](#10-api-contract) | [ADRs](#14-architecture-decisions-adrs) | [Security](#21-security-controls) | [Release](#25-release-readiness)

**Related:** [API Spec (OpenAPI)](API_SPEC_OPENAPI.yaml) | [Glossary](../GLOSSARY.md) | [Project Index](../README.md) | [CLAUDE.md](../../CLAUDE.md)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision and Scope](#2-product-vision-and-scope)
3. [Personas](#3-personas)
4. [End-to-End User Journey](#4-end-to-end-user-journey)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Backend Architecture](#8-backend-architecture)
9. [Data Model](#9-data-model)
10. [API Contract](#10-api-contract)
11. [Authentication and Identity](#11-authentication-and-identity)
12. [ARM Deployment Execution](#12-arm-deployment-execution-v2)
13. [Proof Artifact Format](#13-proof-artifact-format)
14. [Architecture Decisions (ADRs)](#14-architecture-decisions-adrs)
15. [Frontend Implementation Backlog](#15-frontend-implementation-backlog)
16. [Backend Implementation Backlog](#16-backend-implementation-backlog)
17. [Agent Model and Task Split](#17-agent-model-and-task-split)
18. [Branch and PR Strategy](#18-branch-and-pr-strategy)
19. [10-Day Execution Schedule](#19-10-day-execution-schedule)
20. [Traceability Matrix](#20-traceability-matrix)
21. [Security Controls](#21-security-controls)
22. [Observability and Operations](#22-observability-and-operations)
23. [Testing Strategy](#23-testing-strategy)
24. [Risks and Mitigation](#24-risks-and-mitigation)
25. [Release Readiness](#25-release-readiness)

---

## 1. Executive Summary **[v2]**

Build a secure web application where authenticated users (Microsoft SSO) can deploy Azure resources in two ways:

1. Choose a predefined template, or
2. Build a deployment resource-by-resource.

When users submit:
- API validates the payload and enqueues a deployment job.
- Azure Function picks up the job and executes the ARM deployment.
- ARM is the source of truth for deployment status — no database.
- Frontend polls ARM (via API route) and shows a proof popup for manual HOD approval.

Approval workflow is manual and out of scope.

### Business Outcomes
- Faster deployment initiation.
- Consistent deployment records.
- Reduced manual errors.
- Clear evidence artifact for management approval trails.

---

## 2. Product Vision and Scope

### Vision
Reduce friction for non-expert cloud users to request/deploy Azure infrastructure safely and quickly.

### In Scope
- Microsoft Entra ID SSO login.
- Authenticated access to deployment flows.
- Template flow and custom flow.
- Review and submit.
- Backend deployment intake API.
- Backend Bicep trigger pipeline.
- Status tracking (`accepted` / `running` / `succeeded` / `failed`).
- Copyable proof modal for HOD evidence.

### Out of Scope
- In-app approval routing/approval state machine.
- Financial governance automation.
- Multi-cloud deployment targets.
- Full policy-as-code governance orchestration.
- Budget/quota governance automation.

---

## 3. Personas

| Persona | Description |
|---------|-------------|
| **Requester** | Engineer/analyst who wants guided deployment without deep Azure knowledge |
| **Power user** | Cloud engineer who wants flexible resource-by-resource deployment |
| **HOD** | External reviewer who receives copied proof text manually for approval |
| **Platform operator** | Ensures backend health, security, and traceability |

---

## 4. End-to-End User Journey

1. User opens web app.
2. User signs in using Microsoft SSO.
3. User chooses deployment mode: template or custom builder.
4. User configures details.
5. User reviews final configuration.
6. User submits.
7. Backend validates + stores + triggers Bicep.
8. Frontend shows confirmation modal with copyable proof text.
9. User copies proof and sends to HOD manually.

### Journey A: Template Flow
1. User lands on home page (`/`) and selects templates.
2. User opens template catalog (`/templates`) and filters by category.
3. User selects a template card → `/templates/[slug]`.
4. User completes multi-step wizard (validated fields per step).
5. User reaches `/review` and confirms configuration.
6. User submits deployment.
7. User sees success toast + confirmation modal with copyable report.

### Journey B: Custom Builder Flow
1. User lands on home page (`/`) and selects builder.
2. User opens custom builder (`/builder`).
3. User searches/filters resources and opens drawer to configure.
4. User adds one or more resource configs to selected list.
5. User continues to `/review`.
6. User submits deployment.
7. User sees success toast + confirmation modal with copyable report.

---

## 5. Functional Requirements

### Authentication
| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | All deployment pages require authenticated session |
| FR-AUTH-02 | Frontend must propagate bearer token to backend for every protected endpoint |
| FR-AUTH-03 | Backend must validate JWT signature/issuer/audience/tenant and reject invalid tokens |

### Frontend Routing
| ID | Requirement |
|----|-------------|
| FR-1 | Routes: `/` (home), `/templates` (catalog), `/templates/[slug]` (wizard), `/builder` (custom), `/review` (shared), `/login` (SSO entry) |
| FR-2 | Home page: two clear CTAs (templates vs. builder), motion/ambient visuals |
| FR-3 | Template catalog: load from `data/templates.json`, category filter pills (all, compute, network, data, security, landing-zone), card with icon/name/description/count |
| FR-4 | Template wizard: resolve slug, set mode, stepper with text/number/select/toggle fields, per-step validation, back/next/review navigation, summary panel |
| FR-5 | Custom builder: load from `data/resources.json`, search + category filter, drawer form with dynamic fields, add/remove resources, duplicate prevention, continue to review |
| FR-6 | Zustand store (`store/deploymentStore.ts`): mode, template, wizard state, resources, submissionId, summary, reset. Selecting new template resets wizard. |
| FR-7 | Review page: guard against empty state (redirect to `/`), render template or resource summary, submit with loading state, success toast + modal, error toast |
| FR-8 | Report generation: header, reference ID, locale date/time (`en-MY`), mode details, config values. Copyable via clipboard API. |
| FR-9 | Theme: light/dark via `data-theme` on `<html>`, persist in localStorage, CSS variable tokens, UI primitives (Button, Card, Badge, Modal, Toast) |
| FR-10 | Accessibility: labeled controls, dialog semantics, form error association, keyboard support (Escape, Enter/Space), reduced motion |

### Submission and Deployment
| ID | Requirement |
|----|-------------|
| FR-SUBMIT-01 | `POST /deployments` returns `201` + `submissionId` on success |
| FR-SUBMIT-02 | Submission durably persisted with submitter identity and metadata |
| FR-DEPLOY-01 | Submission triggers async Bicep execution |
| FR-DEPLOY-02 | Status lifecycle persisted: `accepted`, `running`, `succeeded`, `failed` |

### Proof Modal
| ID | Requirement |
|----|-------------|
| FR-PROOF-01 | Copyable plain text including: submissionId, submitter name/email, timestamp, mode, items selected, target RG/subscription, status |

### API Operations
| ID | Requirement |
|----|-------------|
| FR-API-01 | Health (`/healthz`) and readiness (`/readyz`) endpoints |
| FR-API-02 | Status retrieval: `GET /deployments/{submissionId}` |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Security** | Token validation, CORS allowlist, rate limiting, body size limit, no secret leakage, secure secret management |
| **Reliability** | Accepted submissions persisted before async execution; failures captured |
| **Performance** | `POST /deployments` P95 <= 500ms (acceptance path only) |
| **Operability** | Structured JSON logs with `requestId`/`submissionId`; health/readiness probes; metrics |
| **Maintainability** | Centralized types/contracts; strict file ownership; CI quality gates mandatory |
| **Testability** | Vitest/RTL coverage on critical modules; lint/test/build gates |
| **Availability** | 99.5% target (backend) |

### Architecture Constraints **[v2]**
- Frontend runs server-side (`next start`) — not static export. API routes use managed identity which requires server execution.
- UI interactions must feel immediate (lightweight client state, local JSON for browsing).
- Shared utilities for icons and schema generation. All domain types centralized.
- `@/` alias used consistently.

---

## 7. Frontend Architecture **[v2]**

### Stack
- Next.js 16 App Router, server-rendered (`next start` — not static export), React 19
- TypeScript strict mode
- Zustand for shared state
- React Hook Form + Zod
- Tailwind CSS v4 + CSS variable token theme
- Framer Motion (reduced-motion safe)
- Vitest + React Testing Library
- `@azure/arm-resources` + `@azure/identity` (server-side ARM calls from API routes)

### Route Map
| Route | Type | Description |
|-------|------|-------------|
| `/` | Client component | Landing + funnel (Framer Motion animations) |
| `/login` | Client component | SSO entry point (recommended) |
| `/templates` | Server component | Loads templates data, renders `TemplateGrid` (client) |
| `/templates/[slug]` | Server + client | `generateStaticParams` from slugs; `TemplatePageClient` handles wizard |
| `/builder` | Client component | Search/filter/select resources, configuration drawer |
| `/review` | Client component | Guard, submit, success/error feedback |

### State Model **[v2]**
```ts
interface DeploymentState {
  mode: 'template' | 'custom' | null
  selectedTemplate: { slug: string; name: string; steps: TemplateStep[] } | null
  wizardState: {
    currentStep: number
    completedSteps: number[]
    formValues: Record<string, unknown>
  }
  selectedResources: SelectedResource[]
  submissionId: string | null
  deployedResourceGroup: string | null  // used to poll ARM status
  deploymentSummary: string | null
  deploymentStatus: DeploymentStatus | null
  deploymentError: string | null
}
```

Key invariants:
- `mode` must be set before `/review` can render.
- Selecting a new template resets wizard state.
- `selectedResources` must not contain duplicate resource `type` values.
- `deployedResourceGroup` is set on submission and used by the polling loop to query ARM.

### Component Architecture

**Layout:** `RootLayout` → `PageShell` → `Nav` + `ThemeToggle`

**UI Primitives:** `Button`, `Card`, `Badge`, `Modal`, `Toast`

**Feature Components:**
- Templates: `TemplateGrid`, `FilterPills`, `TemplateCard`
- Wizard: `Stepper`, `WizardStep`, `SummaryPanel`
- Builder: `ResourceCatalog`, `ResourceDrawer`, `SelectedPanel`
- Review: `ReviewSection`, `SubmitButton`, `ConfirmModal`

### Validation Design
Centralized builder in `lib/schema.ts`:
- `text`/`select`: required → non-empty string, optional → optional string
- `number`: required → `z.coerce.number()`, optional → optional coerced number
- `toggle`: boolean

### Styling and Theming
- Semantic design tokens in CSS variables (`--color-bg`, `--color-surface`, etc.)
- Dark by default; light theme overrides on `html[data-theme='light']`
- Theme persisted in `localStorage` key `sandbox-theme`
- Token-based Tailwind classes only (no hardcoded colors)

### Data Sources
- `data/templates.json` — 8 templates with slug, metadata, category, icon, resource count, step schemas
- `data/resources.json` — 8 resource types with Azure type, metadata, category, icon, config schema

### Type Contracts
`types/index.ts`:
- `Template`, `TemplateStep`, `FieldSchema`
- `AzureResource`, `SelectedResource`
- `DeploymentPayload`, `SubmitResponse`

### Frontend Environment
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Backend API base URL |

---

## 8. Backend Architecture **[v2]**

> The original v1.2.0 plan specified a separate Fastify service. This was superseded — see ADR-016. The backend is implemented as Next.js 16 App Router API routes co-located in `web/`, with Azure Functions for async ARM execution.

### Stack
- **API routes:** Next.js 16 App Router Route Handlers (`web/app/api/`)
- **Async execution:** Azure Functions v4 (queue-triggered, `functions/`)
- **ARM SDK:** `@azure/arm-resources` + `@azure/identity` (`DefaultAzureCredential`)
- **Queue:** Azure Storage Queue (`deployment-jobs`) — decouples submission from execution
- **Validation:** Zod (request payloads and env vars)
- No separate backend process, no database, no Docker

### Service Layers
- **API layer:** Next.js Route Handlers — validation, queue dispatch, ARM status queries
- **Execution layer:** Azure Function — RG creation, ARM deployment, tagging
- **Status layer:** ARM itself — deployment `provisioningState` is the source of truth

### API Responsibilities
- Payload validation (Zod)
- `submissionId` generation (`crypto.randomUUID()`)
- Queue dispatch (`deployment-jobs`)
- ARM status polling (`deployments.get(rg, submissionId)`)
- ARM resource group listing by `deployedBy` tag

### Function App Responsibilities
- Dequeue job message
- Create/update resource group with policy tags + `deployedBy` + `iac-submissionId`
- Execute ARM deployment (ARM SDK, managed identity)
- ARM deployment name = `submissionId` (enables status lookup)

### Project Structure (as-built)
```
web/app/api/
  deployments/
    route.ts           # POST only — generate ID, enqueue
    [submissionId]/
      route.ts         # GET ?rg=<rgName> — ARM status
  my-deployments/
    route.ts           # GET — list RGs by deployedBy tag
  healthz/
    route.ts

web/lib/
  arm.ts               # getArmClient() factory
  server-env.ts        # Zod env validation
  errors.ts
  deployments/
    schema.ts          # Zod payload schemas
    rg-name.ts
    arm-status.ts      # mapArmProvisioningState → DeploymentStatus

functions/src/
  functions/processDeployment.ts
  lib/env.ts
  modules/deployments/
    bicep-executor.ts
    arm-template-builder.ts
    deployment.schema.ts
    rg-name.ts
```

### Validation and Error Format
Standard error response (ADR-007):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "path": "template.slug", "message": "Required" }
    ]
  },
  "requestId": "req_..."
}
```

### Environment Variables
| Variable | Service | Description |
|----------|---------|-------------|
| `AZURE_SUBSCRIPTION_ID` | web + functions | Subscription for ARM operations |
| `AZURE_TENANT_ID` | web + functions | Azure AD tenant ID |
| `AZURE_STORAGE_CONNECTION_STRING` | web | Queue connection string |
| `DEPLOYMENT_QUEUE` | functions | Queue connection (Azure Functions binding) |

---

## 9. Data Model **[v2]**

> No database. ARM is the source of truth. See ADR-018 and ADR-019.
>
> **Glossary:** [ARM](../GLOSSARY.md#arm--azure-resource-manager) | [Resource Group](../GLOSSARY.md#resource-group--rg) | [Submission](../GLOSSARY.md#submission) | [SubmissionId](../GLOSSARY.md#submissionid) | [Policy Tags](../GLOSSARY.md#policy-tags)

### ARM Resource Group Tags (per deployment)

Every resource group created by this system carries the following tags:

| Tag key | Source | Description |
|---------|--------|-------------|
| `Cost Center` | User input (required by policy COE-Enforce-Tag-RG) | Cost allocation |
| `Project ID` | User input | Project identifier |
| `Project Owner` | User input | Owner name |
| `Expiry Date` | User input (YYYY-MM-DD) | Expiry for cleanup |
| `deployedBy` | App-set | User identity (UPN, hardcoded until MSAL) |
| `iac-submissionId` | App-set | The `submissionId` UUID for status back-lookup |

### Status Tracking

- ARM deployment name = `submissionId`
- Status queried via `client.deployments.get(resourceGroupName, submissionId)`
- Mapping: `Succeeded` → `succeeded`, `Failed`/`Canceled` → `failed`, `Running`/`Accepted` → `running`, 404 → `accepted` (not yet started)

### "My Stuff" Listing

- ARM resource groups filtered by tag: `deployedBy eq 'demo@sandbox.local'`
- Each RG exposes its tags (Cost Center, Project ID, etc.) and the `iac-submissionId` for status lookup

---

## 10. API Contract **[v2]**

**Glossary:** [Deployment](../GLOSSARY.md#deployment) | [SubmissionId](../GLOSSARY.md#submissionid) | [Resource Group](../GLOSSARY.md#resource-group--rg) | [Status](../GLOSSARY.md#accepted-status)

**See also:** [Full OpenAPI Specification](API_SPEC_OPENAPI.yaml) | [Authentication (Section 11)](#11-authentication-and-identity)

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/healthz` | Liveness probe |
| `POST` | `/api/deployments` | Submit deployment |
| `GET` | `/api/deployments/{submissionId}?rg={rgName}` | Get deployment status from ARM |
| `GET` | `/api/my-deployments` | List user's deployed resource groups |

> Note: No `/readyz` — there is no database to check.

### POST /api/deployments — Request

Both modes require `tags` (policy-required):

**Template mode:**
```json
{
  "mode": "template",
  "tags": {
    "Cost Center": "CC-001",
    "Project ID": "PROJ-001",
    "Project Owner": "Alice",
    "Expiry Date": "2027-01-01"
  },
  "template": {
    "slug": "web-application",
    "formValues": { "appName": "my-app", "region": "southeastasia" }
  }
}
```

**Custom mode:**
```json
{
  "mode": "custom",
  "tags": { "Cost Center": "CC-001", "Project ID": "PROJ-001", "Project Owner": "Alice", "Expiry Date": "2027-01-01" },
  "resources": [
    { "type": "Microsoft.KeyVault/vaults", "name": "Key Vault", "icon": "KeyRound", "config": { "vaultName": "kv-prod" } }
  ]
}
```

### POST /api/deployments — Response (201)
```json
{ "submissionId": "550e8400-e29b-41d4-a716-446655440000", "resourceGroup": "my-app-rg" }
```

### GET /api/deployments/{submissionId}?rg={rgName} — Response (200)
```json
{ "submissionId": "550e8400-e29b-41d4-a716-446655440000", "status": "running", "errorMessage": null }
```

### GET /api/my-deployments — Response (200)
```json
[
  {
    "resourceGroup": "my-app-rg",
    "location": "southeastasia",
    "tags": { "Cost Center": "CC-001", "Project ID": "PROJ-001", "Project Owner": "Alice", "Expiry Date": "2027-01-01", "deployedBy": "demo@sandbox.local", "iac-submissionId": "550e..." },
    "status": "succeeded",
    "submissionId": "550e8400-...",
    "deployedAt": "2026-04-20T10:00:00.000Z"
  }
]
```

### Error Response (400/500)
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

### Status Enum
`accepted` | `running` | `succeeded` | `failed`

> `accepted` = queued but ARM deployment not yet created. `running` = ARM deployment in progress.

---

## 11. Authentication and Identity

### Entra Configuration (minimum)
- App registration for frontend (SPA, redirect URIs configured)
- App registration for backend API audience
- Allowed tenant strategy (single-tenant for internal tool)

### Token Handling
- Frontend acquires access token for the backend API scope via MSAL
- Every request to a protected endpoint includes `Authorization: Bearer <token>`
- Backend validates: signature (JWKS), issuer, audience (`ENTRA_CLIENT_ID`), tenant (`ENTRA_TENANT_ID`), expiration
- Invalid or missing token → `401 UNAUTHORIZED`

### Identity Persistence
JWT claims stored on every submission for audit trail:
- `oid` → `user_id`
- `name` → `user_name`
- `preferred_username` → `user_email`
- `tid` → `tenant_id`

---

## 12. ARM Deployment Execution **[v2]**

> Original v1.2.0 specified Azure CLI (`az deployment group create`). This was superseded by ARM SDK + Azure Functions — see ADR-017.

### Execution Path
1. `POST /api/deployments` validates payload, generates `submissionId` (UUID), derives resource group name, enqueues JSON message to `deployment-jobs` queue. Returns `{ submissionId, resourceGroup }`.
2. Azure Function picks up queue message (triggered by `deployment-jobs`).
3. Function builds ARM template from payload using `arm-template-builder.ts`.
4. Function validates template against subscription policy (`COE-Allowed-Resources`).
5. Function creates/updates resource group with policy tags + `deployedBy` + `iac-submissionId` (idempotent).
6. Function calls `client.deployments.beginCreateOrUpdateAndWait(rg, submissionId, ...)` — ARM deployment name = `submissionId`.
7. On success: ARM `provisioningState` = `Succeeded`. On failure: ARM records error details in deployment operations.

### ARM Template Building
All resource types are built in-process via `arm-template-builder.ts`:
- Template mode: slug → builder function (web app, VM, database, storage, VNet, Key Vault, container app, landing zone)
- Custom mode: resource type → builder function
- Every resource gets the policy tags applied via COE-Enforce-Tag-Resources

### Subscription Policy Constraints
- `COE-Allowed-Resources`: only specific resource types permitted (validated before RG creation)
- `COE-Enforce-Tag-RG`: Cost Center, Project ID, Project Owner, Expiry Date required on every RG
- `COE-Enforce-Tag-Resources`: same 4 tags required on each individual resource
- App Service SKUs: restricted to F1, B1, B2, B3

### Status Lifecycle
ARM `provisioningState` → app status:
- Not found (404) → `accepted`
- `Running` / `Accepted` → `running`
- `Succeeded` → `succeeded`
- `Failed` / `Canceled` → `failed`

### Authentication
- Local dev: `Connect-AzAccount` (PowerShell) or `az login` → `DefaultAzureCredential`
- Production: managed identity on App Service and Function App → `DefaultAzureCredential`
- Managed identity object IDs: App Service `ec30f747`, Function App `6f19f683`
- Required RBAC: `Contributor` on `sub-epf-sandbox-internal`

### Deployment Scope
- Resource-group scope only (ADR-015)

---

## 13. Proof Artifact Format

**Glossary:** [Proof](../GLOSSARY.md#proof--proof-artifact) | [SubmissionId](../GLOSSARY.md#submissionid) | [HOD](../GLOSSARY.md#hod--head-of-department)

Plain text, stable, copy-safe:

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
- Resource 2: ...

Note: Manual HOD approval is required outside this system.
```

---

## 14. Architecture Decisions (ADRs)

### ADR-001: Next.js 16 static-export frontend
- **Status:** Accepted
- **Decision:** Keep frontend as static export (`output: 'export'`).
- **Consequences:** Simple hosting/CDN, API must be external, auth is client-centric.

### ADR-002: Microsoft SSO mandatory for deployment actions
- **Status:** Accepted
- **Decision:** Require Entra ID login for template/builder/review and all submission actions.
- **Consequences:** Anonymous access restricted, backend token validation required, audit includes user identity.

### ADR-003: Two deployment UX flows, one backend contract
- **Status:** Accepted
- **Decision:** Normalize template and custom flows into single `POST /deployments` contract.
- **Consequences:** Consistent backend intake, simpler observability, frontend must enforce strict normalization.

### ADR-004: Async deployment execution
- **Status:** Accepted
- **Decision:** Submission API returns quickly after durable write; worker handles Bicep execution.
- **Consequences:** Better API responsiveness, explicit status lifecycle, queue/worker complexity.

### ADR-005: Use Bicep as deployment mechanism
- **Status:** Accepted
- **Decision:** Worker executes Bicep deployment at resource-group scope for v1.
- **Consequences:** Requires managed identity RBAC, parameter mapping layer, failure parsing.

### ADR-006: PostgreSQL for persistence
- **Status:** Accepted
- **Decision:** Use PostgreSQL for submissions and event history.
- **Consequences:** Migration/versioning needed, readiness checks must include DB, retention policy required.

### ADR-007: Error response standardization
- **Status:** Accepted
- **Decision:** Standard `error.code`, `error.message`, optional `details`, plus `requestId`.
- **Consequences:** Easier frontend handling, contract discipline required on future changes.

### ADR-008: Proof modal is plain-text artifact
- **Status:** Accepted
- **Decision:** Copyable plain text with mandatory fields; no in-app approval state.
- **Consequences:** Simple/portable, user must use separate manual workflow, format is compliance-critical.

### ADR-009: Status model for v1
- **Status:** Accepted
- **Decision:** Status enum: `accepted`, `running`, `succeeded`, `failed`.
- **Consequences:** Clear state machine, supports future extension without breaking v1.

### ADR-010: Contract-first delivery and strict file ownership
- **Status:** Accepted
- **Decision:** Freeze API contract early; single owner per critical file area.
- **Consequences:** Lower integration risk, early design effort, owner review mandatory for cross-area changes.

### ADR-011: Security baseline before UAT
- **Status:** Accepted
- **Decision:** Must have token validation, CORS, rate limiting, request limits, secret hygiene before UAT.
- **Consequences:** Hard security gate in pipeline.

### ADR-012: Quality gate policy
- **Status:** Accepted
- **Decision:** No release unless lint/test/build/security/smoke gates all pass.
- **Consequences:** Predictable releases, strict CI enforcement.

### ADR-013: Backend tech stack
- **Status:** Accepted
- **Decision:** Fastify + TypeScript + Zod + Prisma + PostgreSQL. App runs with `tsx` (no Docker for the app). PostgreSQL started locally via Docker Compose.
- **Consequences:** Strong type safety and runtime validation, Prisma migration discipline needed. Docker Compose used only for the database — one command to start it.

### ADR-014: Idempotency behavior
- **Status:** Proposed (v1.1)
- **Decision:** Add optional `Idempotency-Key` handling in v1.1.
- **Consequences:** Reduces duplicate deployments, requires fingerprint storage.

### ADR-015: Initial deployment scope limitation
- **Status:** Accepted
- **Decision:** Limit v1 to resource-group scope only.
- **Consequences:** Safer first release, advanced scopes deferred.

### ADR-016: Next.js API Routes instead of separate Fastify backend **[v2]**
- **Status:** Accepted (supersedes ADR-013)
- **Decision:** Co-locate API routes inside the Next.js 16 App Router (`web/app/api/`) instead of a separate Fastify service. Managed identity via `DefaultAzureCredential` handles all Azure calls.
- **Rationale:** Eliminates a separate Node.js service, deployment, and all inter-service networking. App Service managed identity works natively with Next.js server components.
- **Consequences:** No separate backend port, no Supertest API tests (use Vitest with mocks), all server-side code in `web/`.

### ADR-017: Azure Functions v4 for async ARM execution **[v2]**
- **Status:** Accepted
- **Decision:** Use Azure Functions v4 (queue-triggered) instead of in-process async execution. The Function picks up `deployment-jobs` queue messages and runs ARM deployments.
- **Rationale:** Decouples submission latency from deployment duration (which can be minutes). Functions scale independently. No retry/timeout concerns on the API route.
- **Consequences:** Deployment is fully async — status only available by polling ARM. Function app must have managed identity with `Contributor` on the target subscription.

### ADR-018: ARM as source of truth for deployment status **[v2]**
- **Status:** Accepted
- **Decision:** Deployment status is read directly from ARM (`deployments.get(rg, submissionId)`) rather than maintained in a database. The ARM deployment name equals the `submissionId`, enabling direct lookup. Status before the ARM deployment exists returns `accepted`.
- **Rationale:** Eliminates a synchronization problem — ARM and the app could disagree. ARM is authoritative for what actually happened. Removes a significant complexity layer.
- **Consequences:** Status polling requires both `submissionId` and `resourceGroupName`. POST response includes `resourceGroup`. Client must store and pass `resourceGroup` with status queries.

### ADR-019: Drop PostgreSQL and Prisma **[v2]**
- **Status:** Accepted (supersedes ADR-006, ADR-013)
- **Decision:** Remove PostgreSQL, Prisma, and `DATABASE_URL` entirely. No local docker-compose needed for development.
- **Rationale:** The only data stored was submission metadata and status — both now live in ARM. Eliminating the DB removes: migrations, connection string management, Prisma client generation in CI, readiness check dependency, and local Docker setup.
- **Consequences:** No deployment history if resource group is deleted. "My Stuff" listing is derived entirely from ARM tag queries (`deployedBy` tag). Submission payload is not durably stored (queue message is transient).

---

## 15. Frontend Implementation Backlog

### Sprint 0 — Foundation
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| S0-1: Initialize project scaffold | P0 | Next.js 16 App Router bootstrapped, static export enabled, TypeScript strict + `@/` alias |
| S0-2: Configure lint/test/tooling | P0 | ESLint + Vitest run locally, all `npm run` scripts functional |
| S0-3: Define baseline docs | P1 | PRD/TDD committed, team agrees on DoD and quality gates |

### Sprint 1 — Domain and Shared Platform
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| S1-1: Shared type system | P0 | `types/index.ts` with template/resource/payload/store types, no inline duplicates |
| S1-2: Local data catalogs | P0 | `templates.json` and `resources.json` created, at least one proves rendering |
| S1-3: Zustand deployment store | P0 | Mode/template/wizard/resources/submission/reset actions, duplicate prevention, unit tests |
| S1-4: Schema builder + icon resolver | P0 | `buildSchema(fields)` validates all field types, `getIcon(name)` with fallback, tests |
| S1-5: Reusable UI primitives | P1 | Button/Card/Badge/Modal/Toast implemented, keyboard/focus behavior for modal |

### Sprint 2 — Templates and Wizard Flow
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| S2-1: Template catalog route | P0 | `/templates` loads data and renders grid, category pills work, empty state exists |
| S2-2: Template details with static params | P0 | `/templates/[slug]` pre-generates all slugs, invalid slug shows safe state |
| S2-3: Multi-step wizard | P0 | Stepper reflects state, per-step validation, next/back/review navigation |
| S2-4: Summary panel | P1 | Shows completed step labels + current values, persists across step navigation |
| S2-5: Wizard tests | P1 | Step progression and validation tested |

### Sprint 3 — Builder, Review, and Submit
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| S3-1: Builder catalog + filter/search | P0 | `/builder` renders resources, search + category filters work together |
| S3-2: Resource drawer form | P0 | Drawer opens on select, dynamic fields, valid form adds resource + closes |
| S3-3: Selected resources panel | P0 | Shows resources with remove, continue button only when non-empty |
| S3-4: Shared review page | P0 | Guard redirects if no mode, both mode summaries render, submit handles states |
| S3-5: API client + result handling | P0 | Payload differs by mode, success stores ID + report, error shows feedback |
| S3-6: Confirmation modal + report | P1 | Report visible and copyable, close resets flow state |

### Sprint 4 — Polish and Release
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| S4-1: Theme system + persistence | P0 | Dark/light toggle persists, semantic tokens used |
| S4-2: Accessibility audit | P0 | All controls labeled, dialog/form semantics pass, keyboard navigation works |
| S4-3: Lint and test debt | P0 | Lint 0 errors, all tests pass and match current UI copy |
| S4-4: Smoke validation | P1 | Manual smoke of both flows + one error flow, `/out` works from static host |
| S4-5: Analytics hooks (optional) | P2 | Funnel events for route transitions and submission results |

### Known Defect Backlog
1. Submit button tests may use outdated text → update tests or copy.
2. Theme toggle effect pattern may trigger lint rule → refactor initialization.
3. Dynamic icon component creation may cause lint issue → refactor icon mapping.
4. Unused prop warning in confirmation modal → use or remove prop.

---

## 16. Backend Implementation Backlog

### Sprint B1 — Service Foundation
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| B1-1: Bootstrap service | P0 | Fastify + TypeScript starts with `npm run dev`, `/healthz` returns 200 |
| B1-2: Config/env validation | P0 | `env.ts` validates all vars with Zod, process exits clearly on missing required var |
| B1-3: Structured logging + request IDs | P0 | `X-Request-Id` header on every response, pino JSON logs include `requestId` |
| B1-4: PostgreSQL + Prisma baseline | P0 | `docker-compose up -d` starts DB, migration runs, `/readyz` checks DB connection |

### Sprint B2 — Deployments API
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| B2-1: Payload schemas/validators | P0 | Zod schemas for template + custom modes, errors mapped to standard format |
| B2-2: `POST /deployments` | P0 | Persists to PostgreSQL, returns 201 + `submissionId`, Bicep executor fires async |
| B2-3: `GET /deployments/:submissionId` | P1 | Returns record + current status on hit, 404 on miss |
| B2-4: Bicep executor | P0 | `az deployment group create` runs; exit code maps to `succeeded`/`failed`; status events written |
| B2-5: API tests | P0 | Supertest covers happy paths (both modes) + validation errors + 404 |

### Sprint B3 — Hardening and Security
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| B3-1: JWT validation | P0 | Entra ID token validated (signature, issuer, audience, tenant, expiry); 401 on failure |
| B3-2: CORS | P0 | Origins restricted to `CORS_ORIGINS` env; no wildcard |
| B3-3: Error normalization | P0 | All errors return `{ error: { code, message }, requestId }` |
| B3-4: Rate limiting | P1 | Per-IP limit on `POST /deployments`, 429 response |

### Sprint B4 — Release Gate
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| B4-1: Quality gate | P0 | Lint (0 errors), tests (all pass), build (tsc clean), migrations apply |
| B4-2: Frontend smoke | P0 | Both flows (template + custom) submit to real backend, status visible via GET |
| B4-3: Logging + observability | P0 | JSON logs with `requestId`/`submissionId`, probes active |

---

## 17. Agent Model and Task Split

### Full Agent Model (8 agents)
| Agent | Responsibility | Owns |
|-------|---------------|------|
| A1 | Product/Coordination | PRD quality, acceptance criteria, scope |
| A2 | Frontend Auth + Route Guards | SSO login/logout, protected routes |
| A3 | Frontend Flows | Template + Builder + Review + Proof modal |
| A4 | Backend API + Token Validation | API routes, JWT validation, error handling |
| A5 | Deployment Worker | Bicep adapter, async execution, status updates |
| A6 | Data/DB + Audit Trail | Prisma schema, migrations, repositories |
| A7 | DevOps/Azure Infra | Infra provisioning, CI/CD, managed identity |
| A8 | QA/Security/Release | E2E tests, security checks, release gates |

### Minimal Agent Model (3 agents)
| Agent | Combines | Scope |
|-------|----------|-------|
| Agent 1 | A1 + A2 + Core | Product + auth + architecture + types/store |
| Agent 2 | A3 + A4 + A5 + A6 | Feature delivery (flows + API + worker + DB) |
| Agent 3 | A7 + A8 | Quality + UX + infra + release |

### Frontend Agent Model (6 agents)
| Agent | Scope |
|-------|-------|
| A (Product) | Requirements, acceptance criteria |
| B (Architecture) | Types, store, utilities, route scaffolding |
| C (Templates) | Template catalog + wizard flow |
| D (Builder/Review) | Builder + review + submit + modal |
| E (Design/A11y) | Theme, UI primitives, tokens, keyboard, ARIA |
| F (QA) | Tests, lint, smoke, release checklist |

### Task Phases

**Phase 0 — Contract Freeze**
- T0.1 (A1, A4, A6): Finalize payload/response contracts → update `API_SPEC_OPENAPI.yaml`
- T0.2 (A1, A7): Environment matrix + tenant/subscription mapping

**Phase 1 — Authentication Foundation**
- T1.1 (A2): Frontend SSO + route guards. Depends: T0.1
- T1.2 (A4): Backend JWT validation. Depends: T0.1
- T1.3 (A8): Auth security tests. Depends: T1.1, T1.2

**Phase 2 — Frontend Flows**
- T2.1 (A3): Template flow with normalized payload. Depends: T0.1
- T2.2 (A3): Custom builder flow with normalized payload. Depends: T0.1
- T2.3 (A3): Review + submit + proof modal. Depends: T2.1, T2.2, T3.1

**Phase 3 — Backend API and Persistence**
- T3.1 (A4): `POST /deployments` with validation. Depends: T0.1, T1.2
- T3.2 (A6): Submission persistence model. Depends: T0.1
- T3.3 (A4, A6): `GET /deployments/{submissionId}`. Depends: T3.1, T3.2

**Phase 4 — Bicep Execution**
- T4.1 (A5): Deployment adapter (payload → Bicep params). Depends: T3.1, T3.2
- T4.2 (A5): Async execution pipeline. Depends: T4.1
- T4.3 (A6): Status/event updates. Depends: T4.2

**Phase 5 — Infrastructure and CI/CD**
- T5.1 (A7): Infra for backend + worker + DB + secrets. Depends: T0.2
- T5.2 (A7): Identity and RBAC permissions. Depends: T5.1
- T5.3 (A7, A8): CI/CD with quality gates. Depends: T1–T4

**Phase 6 — QA and Release**
- T6.1 (A8): E2E tests (login → template/custom → submit → proof). Depends: all
- T6.2 (A8, A1): UAT sign-off checklist

### Critical Ownership Rules
| Resource | Owner | Approver |
|----------|-------|----------|
| API contract (`API_SPEC_OPENAPI.yaml`) | A4 | A1 |
| DB schema/migrations | A6 | — |
| CI pipeline files | A7 | — |
| E2E test config | A8 | — |
| Frontend flow components | A3 | — |
| Auth components | A2 | — |

---

## 18. Branch and PR Strategy **[v2]**

### Branch Model
- **Protected:** `main` — CI deploys to Azure App Service on every push
- **Feature branches:** `feature/<scope>` — short-lived, merge directly to `main`
- Use git worktrees (`.worktrees/`) for isolated development

### Merge Gates
- CI checks green (lint + tsc + vitest + build)
- No contract-breaking changes to `API_SPEC_OPENAPI.yaml` without new ADR in Section 14
- Push requires `GIT_SSL_NO_VERIFY=true` (corporate TLS interception)

### PR Template
Each PR must include:
1. Scope summary
2. API contract impact (yes/no)
3. Test evidence (test count before/after)
4. Rollback notes

---

## 19. 10-Day Execution Schedule

| Day | Activities | Exit Criteria |
|-----|-----------|---------------|
| **1** | A1: scope lock. A4: freeze API contract. A6: draft DB schema. A7: env matrix. A8: test matrix. | Payload schema frozen, status/error codes frozen |
| **2** | A2: SSO bootstrap. A4: JWT middleware. A6: migration v1. A7: DEV infra skeleton. A8: auth test cases. | Token validation works locally |
| **3** | A2: route guards. A4: route skeletons. A6: repository layer. A8: auth integration tests. | Unauth users blocked, auth requests reach handlers |
| **4** | A3: template + custom flow normalization. A4: payload validation. A8: contract tests. | Frontend payloads pass backend validation |
| **5** | A4: `POST /deployments` complete. A6: identity + payload persistence. A4/A6: `GET /deployments/{id}`. A8: API tests. | Submit stores record and returns submissionId |
| **6** | A5: deployment adapter + worker bootstrap. A7: managed identity + RBAC. A6: status transition hooks. | Worker can start deployment in DEV |
| **7** | A5: finalize status transitions. A3: proof modal with all fields + clipboard. A8: UX tests. | Proof text complete, copyable, consistent |
| **8** | A4: request limits + error guarantees. A7: observability. A5: failure handling. A8: negative testing. | Failure scenarios produce predictable behavior |
| **9** | A8: full E2E (both flows). A1: acceptance criteria validation. All: defect fixes. | P0/P1 closed, E2E green |
| **10** | A7: deploy to UAT. A8: release gate. A1: UAT sign-off. All: rollback plan. | Production-ready package with signed checklist |

---

## 20. Traceability Matrix

### Functional Requirements
| Req ID | Requirement | Owner | Task | Verification | Evidence |
|--------|-------------|-------|------|--------------|----------|
| FR-AUTH-01 | Protected routes require auth | A2 | T1.1 | Route guard tests | CI output + screenshots |
| FR-AUTH-02 | Bearer token propagation | A2+A4 | T1.1, T1.2 | API auth tests | Request logs |
| FR-AUTH-03 | JWT validation | A4 | T1.2 | Unit + negative tests | 401 cases |
| FR-FLOW-01 | Template dynamic forms | A3 | T2.1 | Component + flow tests | Wizard tests + payload snapshot |
| FR-FLOW-02 | Custom search/filter/drawer | A3 | T2.2 | Component + flow tests | Builder tests + payload snapshot |
| FR-FLOW-03 | Contract-compliant payloads | A3+A4 | T2.1, T2.2, T3.1 | Contract tests | Validation report |
| FR-SUBMIT-01 | POST returns 201 + ID | A4 | T3.1 | API happy path | Test report |
| FR-SUBMIT-02 | Durable persistence + identity | A6 | T3.2 | Repo tests + DB assertions | Migration + query evidence |
| FR-DEPLOY-01 | Async Bicep execution | A5 | T4.1, T4.2 | Worker integration tests | Worker logs |
| FR-DEPLOY-02 | Status lifecycle persisted | A5+A6 | T4.3 | Status transition tests | DB event trail |
| FR-PROOF-01 | Proof modal + clipboard | A3 | T2.3 | UI tests + manual smoke | Recording + artifact sample |
| FR-API-01 | Health/readiness endpoints | A4+A7 | T3.1, T5.1 | Probe tests | Monitoring output |
| FR-API-02 | Status retrieval by ID | A4+A6 | T3.3 | API tests 200/404 | Test results |

### Non-Functional Requirements
| NFR ID | Requirement | Owner | Verification | Evidence |
|--------|-------------|-------|--------------|----------|
| NFR-SEC-01 | Security baseline | A4+A7+A8 | Security tests + config | Pipeline report |
| NFR-REL-01 | Durable submissions | A6 | Persistence + failure tests | DB transaction report |
| NFR-PERF-01 | P95 <= 500ms | A4+A8 | Load/perf tests | Benchmark |
| NFR-OPS-01 | Structured logs/metrics | A7 | Observability validation | Dashboard + alert evidence |
| NFR-MAINT-01 | Contract discipline | A1 | PR review audit | PR compliance |
| NFR-QUAL-01 | Quality gates pass | A8 | CI pipeline | Green CI links |

### Test Coverage Targets
| Layer | Target | Owner | Required Suites |
|-------|--------|-------|-----------------|
| Frontend unit/component | 80% critical | A3+A8 | Store/forms/modal/submit |
| Backend unit | 80% critical | A4+A5+A6+A8 | Validation/service/repo |
| Backend API | 100% endpoints | A4+A8 | Auth/validation/status |
| Worker integration | Key paths | A5+A8 | Bicep adapter/transitions |
| E2E | 2 happy + 1 negative | A8 | SSO→template/custom→submit→proof |

### UAT Sign-Off Matrix
| ID | Scenario | Pass Criteria | Sign-off |
|----|----------|---------------|----------|
| UAT-01 | Login via SSO | Auth access granted | Product + Security |
| UAT-02 | Template deploy submit | ID returned, status starts, proof works | Product + Platform |
| UAT-03 | Custom deploy submit | ID returned, status starts, proof works | Product + Platform |
| UAT-04 | Invalid payload | Actionable validation error | QA |
| UAT-05 | Deployment failure | Status updates to failed with reason | Platform |
| UAT-06 | Operational probes | Health/readiness + alerts validated | DevOps |

---

## 21. Security Controls

### Authentication and Authorization
- Microsoft Entra ID SSO mandatory
- JWT token validation (signature, issuer, audience, tenant, expiration)
- Bearer token required on all protected endpoints
- User identity captured and stored on every submission for audit

### Network and API Security
- HTTPS everywhere
- CORS restricted to `CORS_ORIGINS` env (no wildcard in production)
- Request body size limit
- Rate limiting on submission endpoint
- Input validation at API boundary (Zod)

### Data Protection
- No database — no SQL injection surface
- Secrets only via environment variables / Azure Key Vault / managed identity
- Never log `Authorization` headers or credential values

### Deployment Security
- Managed identity for Azure resource access (no stored credentials)
- Least-privilege RBAC role assignments
- `az login` for local dev; managed identity for production

---

## 22. Observability and Operations

### Logging
- JSON structured logs (pino)
- Every request logs: `timestamp`, `level`, `requestId`, `route`, `statusCode`, `latencyMs`
- Submission routes additionally log: `submissionId`, `mode`
- Never log `Authorization` headers or credentials

### Probes
- **Liveness:** `GET /api/healthz` — returns 200 if process is alive
- No readiness probe — no database dependency

### Rollback Plan
- Redeploy previous App Service artifact via Azure Portal or re-run CI on previous commit
- Functions: redeploy previous function app package

---

## 23. Testing Strategy

### Frontend
- Unit/component tests: store, form components, modal/submit flows
- Integration tests: template/custom path payload correctness
- Quality gates: `npm run lint` (0 errors), `npm run test:run` (pass), `npm run build` (static export)

### Backend
- Unit tests: validation, service, repository, ID generation
- API tests: happy path both modes, malformed payloads, unsupported mode, GET by ID
- Contract tests: OpenAPI compliance
- Quality gates: lint/test/build/migrations

### Worker
- Integration tests: Bicep adapter, status transitions, failure paths

### End-to-End
- Login → template → submit → proof copy
- Login → custom → submit → proof copy
- Failed deployment with visible status

---

## 24. Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| SSO integration delays | Lock Entra app registration + scopes on Day 1 |
| Bicep runtime permission issues | Provision managed identity + RBAC early (Day 6 latest) |
| Payload-contract drift | OpenAPI contract-first + contract tests mandatory |
| Flaky E2E tests | Deterministic fixtures, retry-safe harness |
| Deployment failures not visible | Status endpoint + clear modal/status messaging |
| Shared state corruption across routes | Single store source of truth + store transition tests |
| Validation mismatch UI ↔ backend | Strict type contracts + centralized `buildSchema` + API tests |
| Test fragility from copy changes | Match assertions to stable accessibility labels |

---

## 25. Release Readiness

### Implementation Sequence (strict order)
1. Freeze contracts (API spec, proof fields, status enum, error codes)
2. Security first (SSO frontend, JWT backend, protected routes)
3. Core features (template flow, custom flow, review/submit)
4. Backend intake + persistence (POST + GET + storage)
5. Bicep execution pipeline (worker, status transitions)
6. Proof modal + HOD artifact (all fields, clipboard)
7. Hardening (lint, tests, security checks)
8. Release (CI/CD, UAT sign-off, production rollout)

### Release Checklist
- [ ] Auth flow validated in target tenant
- [ ] Protected routes enforced
- [ ] Template flow deployment path passes
- [ ] Custom flow deployment path passes
- [ ] Proof modal fields complete and clipboard works
- [ ] Backend status transitions visible and accurate
- [ ] Logs/metrics/alerts active
- [ ] CI quality gates green
- [ ] Rollback plan reviewed
- [ ] Lint/tests/build all pass
- [ ] UAT sign-off complete

### Required Evidence Pack
1. OpenAPI contract version and changelog
2. Migration files and DB schema snapshot
3. CI run: lint/test/build/security all green
4. E2E artifacts for both flows
5. Sample proof text artifact
6. Observability screenshots (metrics + alerts)
7. UAT sign-off checklist with approvers

### Definition of Done (Program Level)
1. Authenticated users can deploy from both flows
2. Backend triggers Bicep deployments successfully
3. Submission proof artifact is copyable and complete
4. Auditability and operational readiness in place
5. All quality and security gates pass
6. UAT sign-off complete

### Change Control
Any requirement change must update:
1. This spec document (relevant section)
2. Affected task references and test cases
3. `API_SPEC_OPENAPI.yaml` if contract-related
