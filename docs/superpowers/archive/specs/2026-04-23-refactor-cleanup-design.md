# IAC-Sandbox Refactor & Cleanup — Design Spec

**Date:** 2026-04-23  
**Status:** Approved

---

## Overview

A phased cleanup sprint across the IAC-Sandbox monorepo (`web/` Next.js app + `functions/` Azure Functions). Four focused PRs, each independently deployable. Goal: reduce maintenance burden, improve observability, and close test coverage gaps before adding new features.

---

## Phase 1 — Dependencies + Quick Wins

**Goal:** Safe, low-risk changes that unblock later phases.

### Dependency upgrades

- `web/package.json`: upgrade `@types/node` from `^20` to `^22` (matches Node 22 runtime and functions devDep)
- `functions/package.json`: upgrade `@azure/arm-resources` from `^5.2.0` to `^7.0.0`
  - v7 removed the `deployments` namespace from `ResourceManagementClient` — same issue already solved in `web/lib/arm.ts`
  - `functions/src/modules/deployments/bicep-executor.ts` must be updated to use a custom fetch-based `deployments` accessor, mirroring the pattern in `web/lib/arm.ts`
  - `@azure/identity` version gap (functions: `^4.4.0`, web: `^4.13.1`) is acceptable; no upgrade required

### ESLint rule

- Add `"no-console": ["warn", { allow: ["error", "warn"] }]` to `web/eslint.config.mjs`
- This will surface any stray `console.log` without breaking existing `console.error` calls in API routes

### TypeScript sourcemaps

- Add `"sourceMap": true` to `functions/tsconfig.json` for better Azure Functions stack traces

### Dead code

- Check `web/app/login/page.tsx` — if it has no inbound links and no tests, remove it
- Document removal reason in commit message (deferred MSAL feature; credentials never provided)

**Acceptance criteria:**
- `npm run build` passes in `web/`
- `npm run build` passes in `functions/`
- CI workflows green
- No TypeScript errors introduced

---

## Phase 2 — Code Quality Cleanup

**Goal:** Remove duplication, tighten types, improve logging.

### Extract name sanitization utilities (functions)

`functions/src/modules/deployments/arm-template-builder.ts` contains 4+ inline sanitization patterns (one per resource type) with inconsistent rules. Extract to `functions/src/modules/deployments/sanitize.ts`:

```
sanitize.ts exports:
  sanitizeStorageName(base: string): string      // lowercase, alphanum only, max 24
  sanitizeKeyVaultName(base: string): string     // lowercase, alphanum+hyphens, max 24
  sanitizeGenericName(base: string): string      // lowercase, alphanum+hyphens, max 63
```

Each builder in `arm-template-builder.ts` calls the appropriate helper instead of inlining the regex.

### Schema sync comment (web ↔ functions)

`web/lib/deployments/schema.ts` and `functions/src/modules/deployments/deployment.schema.ts` define identical Zod shapes. A shared package is out of scope. Instead:

- Add `// SYNC: must match web/lib/deployments/schema.ts` comment at top of the functions schema file
- Align any divergent error messages (functions schema currently omits help text)
- Add a note in `CLAUDE.md` that these two files must be kept in sync

### Structured error logging (web API routes)

Replace the three ad-hoc `console.error(...)` calls in `web/app/api/` with a shared helper:

```typescript
// web/lib/errors.ts — add:
export function logError(endpoint: string, requestId: string, err: unknown): void {
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    endpoint,
    requestId,
    error: err instanceof Error ? err.message : String(err),
  }));
}
```

Update `route.ts`, `[submissionId]/route.ts`, and `my-deployments/route.ts` to call `logError(...)`.

### Fix module-level QueueClient caching

`web/app/api/deployments/route.ts` caches `_queueClient` at module scope. On App Service (long-running process), credentials from `DefaultAzureCredential` can expire mid-session.

- Remove the module-level `_queueClient` variable and `getQueueClient()` factory
- Create the `QueueServiceClient` and `QueueClient` inline inside the `POST` handler
- The client creation is cheap; no connection pooling needed for a queue send

### Fix loose type assertions

Two `as { ... }` casts without guards:

1. `web/app/api/deployments/[submissionId]/route.ts:29` — replace with a type guard function `isArmError(v): v is { code?: string; message?: string }`
2. `functions/src/modules/deployments/arm-template-builder.ts:69` — same pattern; extract `isStatusMessage(v)` guard

**Acceptance criteria:**
- 0 lint warnings on `no-console` rule
- TypeScript strict: 0 errors
- All existing 115 tests still pass

---

## Phase 3 — Test Coverage

**Goal:** Cover the highest-risk untested code paths.

### Priority rationale

- `arm-template-builder.ts` (627 lines, 8 resource builders, 0 tests) — most likely to hide silent bugs; a wrong ARM template only fails at deploy time
- API routes (3 routes, 0 tests) — logic errors here affect all users
- `rg-name.ts` (pure functions, 0 tests) — easy to test, edge cases matter (special chars, length limits)

### `arm-template-builder.ts` tests

File: `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`

Cover per resource builder:
- Happy path: correct ARM resource shape returned
- Name sanitization: special characters, max length truncation
- Tag propagation: user tags appear on the resource
- Policy validation: blocked resource types throw expected error

Cover template assembly:
- All 8 builder outputs are included in the template
- `parameters` and `variables` sections are correct

### API route tests

Files: `web/__tests__/app/api/deployments/route.test.ts`, `[submissionId]/route.test.ts`, `my-deployments/route.test.ts`

Use vitest + mock pattern consistent with existing tests (mock Azure SDK modules directly, not msw).

**POST `/api/deployments`:**
- Valid payload → 200 with `{ submissionId, resourceGroup }`
- Invalid payload (missing required tags) → 400
- Queue send failure → 500
- `submissionId` is a valid UUID

**GET `/api/deployments/[submissionId]`:**
- ARM returns `Succeeded` → mapped status returned
- ARM returns `Running` → mapped status returned
- ARM deployment not found (404 from ARM) → returns `{ status: "accepted" }`
- ARM client throws → 500

**GET `/api/my-deployments`:**
- Returns list of RGs with `deployedBy` tag
- Empty list when no tagged RGs exist
- ARM client throws → 500

### `rg-name.ts` tests

File: `web/__tests__/lib/deployments/rg-name.test.ts`

- `deriveResourceGroupName`: expected output for template/custom modes
- `deriveLocation`: maps region slug to Azure region string
- Sanitization: slashes, spaces, leading hyphens, max-length truncation

**Acceptance criteria:**
- All new tests pass
- No existing tests broken
- `arm-template-builder.ts` has ≥ 1 test per resource builder

---

## Phase 4 — Error Handling + Observability

**Goal:** Make distributed failures diagnosable.

### Correlation ID threading

`submissionId` is already generated at the API layer and included in the queue message. Use it as the correlation key throughout:

- `functions/src/functions/processDeployment.ts`: log `submissionId` on every `context.log()` / `context.error()` call
- `functions/src/modules/deployments/bicep-executor.ts`: accept and log `submissionId` in all error output

This requires no new infrastructure — just passing the already-present ID through the call chain.

### Flatten nested try-catch in `bicep-executor.ts`

Current structure:
```typescript
try {
  result = await beginCreateOrUpdateAndWait(...);
} catch (err) {
  try {
    // fetch operation errors — swallowed on failure
  } catch { /* ignore */ }
  throw new Error(...);
}
```

Refactor:
- Extract `fetchOperationErrors(client, rg, deploymentName): Promise<string>` helper
- This helper has its own try-catch; on failure it logs a warning and returns `"(could not retrieve operation errors)"`
- Outer catch calls the helper and includes its result in the thrown error message

### ARM deployment timeout

`beginCreateOrUpdateAndWait()` blocks until ARM completes. Azure Functions default timeout is 5–10 minutes; a long ARM deployment can cause silent function timeout with no useful log.

- Wrap the wait call with `Promise.race()` against a 20-minute timeout
- On timeout, log the deployment name and throw an `AppError`-equivalent with message `"ARM deployment timed out after 20 minutes"`
- 20 minutes chosen to be safely under the Functions runtime limit while covering typical deployment durations

**Acceptance criteria:**
- `submissionId` appears in all Function log lines for a given deployment
- ARM timeout produces a clear error log, not a silent function kill
- Nested catch no longer swallows operation errors silently

---

## Out of Scope

- Review page polling interval (3000ms fixed — acceptable at current scale)
- Shared monorepo package for schema (two files; comment-based sync is sufficient)
- Structured JSON logging in Azure Functions (context.log is adequate; App Insights handles formatting)
- MSAL / Entra ID sign-in (blocked on admin providing App Registration credentials)
- `@azure/arm-resources` version gap (web v7, functions v5) — eliminated by Phase 1 upgrade; not a separate work item

---

## File Change Summary

| Phase | Files Changed |
|-------|--------------|
| 1 | `web/package.json`, `functions/package.json`, `web/eslint.config.mjs`, `functions/tsconfig.json`, `web/app/login/page.tsx` (delete) |
| 2 | `functions/src/modules/deployments/sanitize.ts` (new), `arm-template-builder.ts`, `functions/src/modules/deployments/deployment.schema.ts`, `web/lib/errors.ts`, `web/app/api/deployments/route.ts`, `web/app/api/deployments/[submissionId]/route.ts`, `web/app/api/my-deployments/route.ts`, `CLAUDE.md` |
| 3 | `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts` (new), `web/__tests__/app/api/deployments/route.test.ts` (new), `web/__tests__/app/api/deployments/[submissionId]/route.test.ts` (new), `web/__tests__/app/api/my-deployments/route.test.ts` (new), `web/__tests__/lib/deployments/rg-name.test.ts` (new) |
| 4 | `functions/src/functions/processDeployment.ts`, `functions/src/modules/deployments/bicep-executor.ts` |
