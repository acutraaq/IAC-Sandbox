# Session Handoff — 2026-04-17

## Project
IAC Sandbox — Azure IaC deployment platform with Next.js 16 frontend + Fastify backend.
- **Repo**: `C:\Users\AB3968\Git\IAC-Sandbox`
- **Branch**: `main`
- **Frontend**: `http://localhost:3000` (Next.js)
- **Backend**: `http://localhost:3001` (Fastify)

## What was done this session

### Subscription policy enforcement (all committed)

Migrated to `sub-epf-sandbox-internal` (`1fed33d2-00fd-40a8-a5c1-c120aec1b902`). Full audit of 8 subscription policies — all enforced or accounted for:

| Policy | How handled |
|---|---|
| COE-Allowed-Resources | Pre-flight `validateTemplateAgainstPolicy()` before RG creation |
| COE-Enforce-Tag-RG + Requires Sandbox tags | Tags on `resourceGroups.createOrUpdate` |
| **COE-Enforce-Tag-Resources** *(new this session)* | Tags injected onto every ARM resource in `buildArmTemplate()` |
| **Sandbox - Restrict App Service SKUs** *(new)* | `planSize` clamped to F1/B1/B2/B3 in `buildWebApplication()` |
| Sandbox - Restrict PostgreSQL | Already compliant (Standard_B1ms + HA disabled hardcoded) |
| Others (MySQL, App Gateway, VM SKUs) | No builders exist — no impact |

**VM + NSG blocked in UI:** `policyBlocked: true` in both JSON data files. `TemplateCard` renders as locked/non-clickable div; `ResourceCatalog` renders as disabled button with "Policy restricted" badge.

Last commit: `b567473` — `feat: enforce subscription policies on ARM deployments and UI`

---

## What's next: Entra ID sign-in with MSAL.js

**Context:** The app is a request/ticketing system. Users sign in to identify themselves on the submission. Azure admin manually grants actual Azure access after HOD approval. No programmatic access grant needed.

**Approach agreed:** MSAL.js (`@azure/msal-browser` + `@azure/msal-react`) — frontend only for now.

**BLOCKED ON:** User needs to create an Azure App Registration and provide:
- **Application (client) ID**
- **Directory (tenant) ID** (should match `AZURE_TENANT_ID` in `backend/.env`)

App Registration setup:
1. Azure Portal → Entra ID → App registrations → New registration
2. Single-tenant, SPA redirect URI = `http://localhost:3000`
3. Add production redirect URI when ready

**What to build once client ID is provided:**
- Install `@azure/msal-browser` + `@azure/msal-react`
- `frontend/lib/msalConfig.ts` — MSAL instance config
- Auth guard in `frontend/app/layout.tsx` — unauthenticated → Microsoft login redirect
- Existing `frontend/app/login/page.tsx` — wire up to MSAL (check what's there first)
- Nav: add user display name + sign-out button
- `frontend/lib/report.ts` — replace hardcoded `Demo User (demo@contoso.com)` and `contoso.onmicrosoft.com` with real signed-in user name + UPN from MSAL account object

**After MSAL is done:**
- B3 remainder: CORS hardening, rate limiting
- B4: ESLint + GitHub Actions CI
- Deployment status polling (frontend for `GET /deployments/:id`)
