# Sandbox Azure Deployer — Complete Specification

> **Version:** v1.0.0 | **Date:** 2026-04-11 | **Status:** Contract-Frozen, Ready for Development
>
> This is the single source of truth for the entire project. It consolidates all previously separate implementation documents. The only other file in this directory is `API_SPEC_OPENAPI.yaml` (machine-readable contract).

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
12. [Bicep Deployment Execution](#12-bicep-deployment-execution)
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

## 1. Executive Summary

Build a secure web application where authenticated users (Microsoft SSO) can deploy Azure resources in two ways:

1. Choose a predefined template, or
2. Build a deployment resource-by-resource.

When users submit:
- Backend validates and stores submission.
- Backend triggers Azure deployment through Bicep.
- Frontend shows a proof popup with copy-to-clipboard text for manual HOD approval.

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

### Architecture Constraints
- Frontend must be static-exportable (`output: 'export'`). No SSR dependencies.
- UI interactions must feel immediate (lightweight client state, local JSON for browsing).
- Shared utilities for icons and schema generation. All domain types centralized.
- `@/` alias used consistently.

---

## 7. Frontend Architecture

### Stack
- Next.js 16 App Router, static export, React 19
- TypeScript strict mode
- Zustand for shared state
- React Hook Form + Zod
- Tailwind CSS v4 + CSS variable token theme
- Framer Motion (reduced-motion safe)
- Vitest + React Testing Library

### Route Map
| Route | Type | Description |
|-------|------|-------------|
| `/` | Client component | Landing + funnel (Framer Motion animations) |
| `/login` | Client component | SSO entry point (recommended) |
| `/templates` | Server component | Loads templates data, renders `TemplateGrid` (client) |
| `/templates/[slug]` | Server + client | `generateStaticParams` from slugs; `TemplatePageClient` handles wizard |
| `/builder` | Client component | Search/filter/select resources, configuration drawer |
| `/review` | Client component | Guard, submit, success/error feedback |

### State Model
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
  deploymentSummary: string | null
}
```

Key invariants:
- `mode` must be set before `/review` can render.
- Selecting a new template resets wizard state.
- `selectedResources` must not contain duplicate resource `type` values.

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

## 8. Backend Architecture

### Stack
- Node.js 22 LTS + Fastify + TypeScript
- Prisma + PostgreSQL 16
- Zod for request validation
- Worker process for Bicep execution
- Docker containerized
- Vitest + Supertest

### Service Layers
- **API layer:** Routes, middleware, error normalization
- **Domain layer:** Submission intake + orchestration trigger
- **Persistence layer:** Submissions/events repositories
- **Worker layer:** Bicep adapter and status update pipeline

### Backend Responsibilities
- Auth token verification
- Payload validation
- Durable persistence
- Deployment execution trigger
- Status retrieval
- Operational telemetry

### Suggested Project Structure
```
backend/
  src/
    app.ts
    server.ts
    routes/
      health.ts
      deployments.ts
    modules/deployments/
      deployment.schema.ts
      deployment.service.ts
      deployment.repo.ts
    lib/
      logger.ts
      errors.ts
      request-id.ts
      env.ts
  prisma/
    schema.prisma
    migrations/
  tests/
    api/
      deployments.test.ts
      health.test.ts
```

### Validation and Error Format
Standard error response:
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

### Idempotency Strategy
- V1: non-idempotent (new ID per successful request)
- V1.1 (proposed): `Idempotency-Key` header support

### Backend Environment
| Variable | Description |
|----------|-------------|
| `PORT` | Server port |
| `NODE_ENV` | Runtime environment |
| `DATABASE_URL` | PostgreSQL connection string |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) |
| `LOG_LEVEL` | Logging verbosity |
| `BODY_LIMIT_BYTES` | Max request body size |
| `ENABLE_GET_DEPLOYMENT` | Feature flag for `GET /deployments/:id` |

---

## 9. Data Model

### Table: `deployment_submissions`
| Column | Type | Notes |
|--------|------|-------|
| `submission_id` | text (PK) | ULID or UUIDv7 |
| `user_id` | text | From JWT `oid` claim |
| `user_email` | text | From JWT `preferred_username` |
| `user_name` | text | From JWT `name` |
| `tenant_id` | text | From JWT `tid` |
| `mode` | text | `template` or `custom` |
| `status` | text | Default `accepted` |
| `payload_json` | jsonb | Full request payload |
| `target_subscription` | text | |
| `target_resource_group` | text | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |
| `correlation_id` | text | Request ID for tracing |

**Indexes:** PK on `submission_id`, index on `created_at DESC`

### Table: `deployment_events`
| Column | Type | Notes |
|--------|------|-------|
| `id` | serial (PK) | |
| `submission_id` | text (FK) | References `deployment_submissions` |
| `event_type` | text | e.g. `status_changed`, `error` |
| `event_payload` | jsonb | |
| `created_at` | timestamptz | |

### Table: `idempotency_records` (v1.1, optional)
| Column | Type | Notes |
|--------|------|-------|
| `idempotency_key_hash` | text | |
| `request_fingerprint` | text | |
| `submission_id` | text | |
| `created_at` | timestamptz | |

---

## 10. API Contract

Canonical source: `API_SPEC_OPENAPI.yaml` (in this directory).

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/healthz` | Liveness probe |
| `GET` | `/readyz` | Readiness probe (checks DB) |
| `POST` | `/deployments` | Submit deployment |
| `GET` | `/deployments/{submissionId}` | Retrieve submission status |

### Request Schemas

**Template mode:**
```json
{
  "mode": "template",
  "template": {
    "slug": "aks-cluster",
    "formValues": { "clusterName": "prod" }
  }
}
```

**Custom mode:**
```json
{
  "mode": "custom",
  "resources": [
    {
      "type": "Microsoft.KeyVault/vaults",
      "name": "Key Vault",
      "icon": "KeyRound",
      "config": { "vaultName": "kv-prod" }
    }
  ]
}
```

### Response Schemas

**Success (201):**
```json
{ "submissionId": "01JQH4NZ4F3RD2RN5C6X7A8B9K" }
```

**Error (400/500):**
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
`accepted` | `queued` | `running` | `succeeded` | `failed`

---

## 11. Authentication and Identity

### Entra Configuration (minimum)
- App registration for frontend
- App registration for backend API audience
- Configured redirect URIs
- Allowed tenant strategy (single or multi-tenant)

### Token Handling
- Frontend acquires access token for backend API scope
- Backend validates: signature, issuer, audience, tenant, expiration

### Identity Persistence
Store identity claims on submission for audit:
- `oid` (user object ID)
- `name`
- `preferred_username` / email
- `tid` (tenant ID)

---

## 12. Bicep Deployment Execution

### Execution Path
1. API accepts request → writes status `accepted`.
2. API enqueues deployment job.
3. Worker marks status `running`.
4. Worker resolves template/resource config into Bicep parameters.
5. Worker executes deployment in target scope.
6. Worker marks `succeeded` or `failed` with details.

### Deployment Scope
- V1: resource-group scope only (ADR-015).

### Implementation Approach
- Async queue model
- Retry policy with capped attempts
- Dead-letter handling for repeated failures
- Azure CLI or ARM SDK for Bicep execution

---

## 13. Proof Artifact Format

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
- **Decision:** Fastify + TypeScript + Zod + Prisma + PostgreSQL.
- **Consequences:** Strong type safety and runtime validation, Prisma migration discipline needed.

### ADR-014: Idempotency behavior
- **Status:** Proposed (v1.1)
- **Decision:** Add optional `Idempotency-Key` handling in v1.1.
- **Consequences:** Reduces duplicate deployments, requires fingerprint storage.

### ADR-015: Initial deployment scope limitation
- **Status:** Accepted
- **Decision:** Limit v1 to resource-group scope only.
- **Consequences:** Safer first release, advanced scopes deferred.

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
| B1-1: Bootstrap service | P0 | Fastify TypeScript starts, `/healthz` and `/readyz` return 200 |
| B1-2: Config/env validation | P0 | Required env vars validated, fails fast on invalid config |
| B1-3: Structured logging + request IDs | P0 | Request ID in logs and response headers |
| B1-4: DB and Prisma baseline | P0 | Schema + migration created, connection verified in readiness check |

### Sprint B2 — Deployments API
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| B2-1: Payload schemas/validators | P0 | Supports template + custom modes, errors mapped to standard format |
| B2-2: `POST /deployments` | P0 | Valid request persists, returns 201 + `submissionId` |
| B2-3: `GET /deployments/:submissionId` | P1 | Returns record on hit, 404 on miss |
| B2-4: API tests + contract checks | P0 | Supertest happy/error paths, OpenAPI aligned |

### Sprint B3 — Hardening and Security
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| B3-1: CORS and body limits | P0 | Origins configurable, body size capped |
| B3-2: Rate limiting | P0 | Per-IP limit, 429 tested |
| B3-3: Idempotency key (optional) | P1 | Duplicate replay semantics |
| B3-4: Error normalization | P0 | All errors use stable machine-readable codes |

### Sprint B4 — Observability and Release
| Story | Priority | Acceptance Criteria |
|-------|----------|---------------------|
| B4-1: Metrics/dashboards | P0 | Request/error/latency metrics exposed |
| B4-2: Docker + deployment | P0 | Container builds in CI, probes configured |
| B4-3: Runbook | P0 | Operational runbook + on-call triage documented |
| B4-4: Release quality gate | P0 | Lint/tests/build/migrations pass, smoke from frontend works |

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

## 18. Branch and PR Strategy

### Branch Model
- **Protected:** `main` (production-ready), `develop` (integration)
- **Feature branches:** one per agent stream, rebase from `develop` daily

| Branch | Owner |
|--------|-------|
| `docs/a1-product-coordination` | A1 |
| `feat/a2-frontend-sso-guards` | A2 |
| `feat/a3-frontend-flows-proof-modal` | A3 |
| `feat/a4-backend-api-auth-validation` | A4 |
| `feat/a5-worker-bicep-execution` | A5 |
| `feat/a6-db-audit-persistence` | A6 |
| `feat/a7-devops-infra-cicd` | A7 |
| `chore/a8-test-security-release-gates` | A8 |

### PR Merge Order (critical path)
| PR | Content | Depends On |
|----|---------|------------|
| PR-0 | Contract/docs freeze | None |
| PR-1 | Backend auth + API skeleton | PR-0 |
| PR-2 | DB schema + persistence | PR-0 |
| PR-3 | Frontend SSO + route guards | PR-0 |
| PR-4 | Deployments API complete | PR-1 + PR-2 |
| PR-5 | Frontend flows + proof modal | PR-3 + PR-4 |
| PR-6 | Worker Bicep execution | PR-2 + PR-4 |
| PR-7 | DevOps and infra | PR-1 + PR-2 |
| PR-8 | QA + hardening gate | PR-5 + PR-6 + PR-7 |

### Merge Gates
- Required reviewers approved
- CI checks green
- No unresolved security warnings
- No contract-breaking changes without PR-0 update

### PR Template
Each PR must include:
1. Scope and linked task IDs
2. Contract impact (`yes/no`)
3. Dependency status
4. Test evidence
5. Rollback notes

### Release Branch
- Create `release/sso-bicep-v1` from `develop` after PR-8
- Full smoke/UAT from release branch
- Hotfixes target release branch → cherry-pick to `develop`
- Merge to `main` only after sign-off

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
- Bearer token propagation to all protected endpoints
- User identity captured for audit trail

### Network and API Security
- HTTPS everywhere
- CORS allowlist from env (no wildcard in production)
- Request body size limit (e.g., 1MB)
- Rate limiting per IP/API key
- Input validation at API boundary

### Data Protection
- Parameterized DB queries via Prisma (no raw SQL)
- Secrets only via environment/secret manager (Key Vault)
- Retention policy: 90-180 days recommended
- Redact sensitive values if future payloads include secrets

### Deployment Security
- Managed identity for Azure resource access
- Least-privilege IAM role assignments
- Dependency + container vulnerability scanning in CI

---

## 22. Observability and Operations

### Logging
- JSON structured logs only
- Fields: `timestamp`, `level`, `requestId`, `route`, `statusCode`, `latencyMs`, `submissionId`
- Never log secrets or raw credentials

### Metrics
- `http_requests_total`
- `http_request_duration_ms`
- `deployment_submissions_total`
- `deployment_validation_failures_total`

### Probes
- **Liveness:** `GET /healthz`
- **Readiness:** `GET /readyz` (checks DB connectivity)

### Alerts (minimum)
- High 5xx rate
- Readiness failures
- P95 latency breach for `POST /deployments`
- Deployment failure ratio threshold

### Incident Response
1. Confirm probe status and latest deploy diff
2. Inspect error rate and top failing route
3. Correlate by `requestId` in logs
4. Roll back if regression confirmed
5. File postmortem with root cause and prevention action

### Rollback Plan
- **Frontend:** Redeploy previous static artifact
- **Backend:** Revert to previous image tag
- **DB:** Forward-fix preferred; only reversible migrations for safe rollbacks

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
