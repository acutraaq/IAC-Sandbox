# Session Handoff — 2026-04-14

## Project
IAC Sandbox — Azure IaC deployment platform with Next.js 16 frontend + Fastify backend.
- **Repo**: `C:\Users\AB3968\Git\IAC-Sandbox`
- **Branch**: `main`
- **Frontend**: `frontend/` — Next.js 16, TypeScript, Tailwind v4, Zustand, Vitest (complete)
- **Backend**: `backend/` — Fastify, TypeScript, Zod, Prisma, PostgreSQL (in progress)

---

## What Was Built This Session

### Backend — Phase B1 (Service Foundation) ✅
Full Fastify backend scaffolded from scratch:
- `src/lib/env.ts` — Zod-validated env config, fails fast at startup
- `src/lib/errors.ts` — AppError class + errorResponse() matching API contract
- `src/lib/logger.ts` — pino logger (pretty in dev, JSON in prod)
- `src/lib/db.ts` — Prisma singleton
- `src/routes/health.ts` — `GET /healthz` (always 200), `GET /readyz` (checks DB)
- `src/app.ts` — Fastify factory with CORS + global error handler
- `src/server.ts` — entry point with graceful shutdown
- `prisma/schema.prisma` — Deployment model with enums (accepted/running/succeeded/failed)
- Migration `20260414071110_init` applied to Azure PostgreSQL

### Backend — Phase B2 (Deployments API) ✅
- `src/modules/deployments/deployment.schema.ts` — Zod discriminated union (template | custom)
- `src/modules/deployments/deployment.repo.ts` — Prisma CRUD functions
- `src/modules/deployments/deployment.service.ts` — orchestrates save → async Bicep → status update
- `src/modules/deployments/bicep-executor.ts` — Azure SDK deployment (NOT CLI)
- `src/routes/deployments.ts` — `POST /deployments` (201 + submissionId), `GET /deployments/:id`

### Key infrastructure decisions
- **Database**: Azure Database for PostgreSQL (cloud, no Docker) at `iac-sandbox-db.postgres.database.azure.com`
- **No Azure CLI** — uses `@azure/arm-resources` + `@azure/identity` SDK instead
- **Auth placeholder**: Phase B2 uses hardcoded `demo@sandbox.local` — real JWT auth is Phase B3
- **Async execution**: Bicep runs fire-and-forget after API returns 201; status updates DB as it progresses

### Verified working
- Server starts: `npm run dev` ✅
- `GET /healthz` → `{"status":"ok"}` ✅
- `GET /readyz` → `{"status":"ok"}` ✅
- `POST /deployments` → `{"submissionId":"..."}` with 201 ✅
- `GET /deployments/:id` → deployment record with status ✅
- Status transitions: `accepted` → `running` → `succeeded/failed` ✅

---

## Current Blocker — Azure Credentials

The Bicep executor uses `DefaultAzureCredential` which needs credentials to call Azure APIs.
Currently `.env` has placeholder values — the deployment reaches `failed` because credentials aren't set.

### What needs to be filled in `backend/.env`
```
AZURE_SUBSCRIPTION_ID=<real-subscription-id>
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<service-principal-client-id>
AZURE_CLIENT_SECRET=<service-principal-secret>
```

### How to get these (Azure Portal — no CLI needed)

**AZURE_SUBSCRIPTION_ID:**
- Portal → search "Subscriptions" → copy the ID

**AZURE_TENANT_ID:**
- Portal → Azure Active Directory → Overview → copy "Tenant ID"

**AZURE_CLIENT_ID + AZURE_CLIENT_SECRET (create a Service Principal):**
1. Portal → Azure Active Directory → App registrations → New registration
2. Name: `iac-sandbox-backend` → Register
3. Copy **Application (client) ID** → `AZURE_CLIENT_ID`
4. Go to **Certificates & secrets → New client secret** → copy value → `AZURE_CLIENT_SECRET`

**Grant permissions (so it can deploy):**
1. Portal → Resource Groups → your RG → Access control (IAM)
2. Add role assignment → **Contributor** → assign to `iac-sandbox-backend`

---

## How to Start the Backend

```powershell
cd C:\Users\AB3968\Git\IAC-Sandbox\backend

# Start server (NODE_OPTIONS needed for corporate SSL cert)
$env:NODE_OPTIONS="--use-system-ca"; npm run dev
```

---

## .env Current State

```
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://sandboxadmin:EPF@12345@iac-sandbox-db.postgres.database.azure.com:5432/sandbox?sslmode=require
ENTRA_TENANT_ID=your-tenant-id          ← placeholder (Phase B3)
ENTRA_CLIENT_ID=your-client-id          ← placeholder (Phase B3)
CORS_ORIGINS=http://localhost:3000
ENABLE_GET_DEPLOYMENT=true
AZURE_SUBSCRIPTION_ID=your-subscription-id  ← NEEDS REAL VALUE
                                             ← also needs AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
```

---

## What's Left

| Phase | What | Status |
|-------|------|--------|
| B1 | Service foundation (Fastify, Prisma, health routes) | ✅ Done |
| B2 | Deployments API (POST + GET, async Bicep) | ✅ Done |
| B3 | Azure credentials in .env | 🔴 Blocked — needs portal setup |
| B3 | JWT auth (Entra ID token validation) | Not started |
| B3 | CORS, rate limiting, hardening | Not started |
| B4 | Quality gates (lint, tests, build) | Not started |
| — | Connect frontend to real backend (remove MSW mock) | Not started |

---

## How to Resume

Start the next session with:

> Read SESSION_HANDOFF.md and continue from where we left off.
> We are building the IAC Sandbox backend. Phase B2 is done and verified.
> The immediate next step is: fill in the Azure credentials in `backend/.env`
> (AZURE_SUBSCRIPTION_ID, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
> by walking through the Azure Portal setup for a Service Principal.
> After that, test that `POST /deployments` reaches `status: succeeded` in Azure.
