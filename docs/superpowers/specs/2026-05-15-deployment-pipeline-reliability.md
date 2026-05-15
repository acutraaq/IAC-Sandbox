# Deployment Pipeline Reliability Fixes

**Date:** 2026-05-15  
**Status:** Approved  
**Scope:** `functions/src/` only — zero web-layer changes

---

## Problem

Six confirmed bugs in the Functions deployment pipeline that cause silent ARM failures (400s after queue delay) or security exposure. All are preemptive fixes from a full audit; no production failures observed yet.

---

## Changes

### 1. `sanitize.ts` — min-length guards on KV and generic names

**Files:** `functions/src/modules/deployments/sanitize.ts`

`sanitizeKeyVaultName` and `sanitizeGenericName` can return strings shorter than 3 characters (e.g. input `"a!!"` → `"a"`). Azure requires Key Vault names ≥ 3 chars and PostgreSQL/SQL/Service Bus names ≥ 3 chars. ARM rejects them with a 400.

Fix: add the same guard already present in `sanitizeStorageName`:
```typescript
return result.length >= 3 ? result : "";
```
Callers already use `|| "fallback-name"` so returning `""` correctly triggers the fallback.

---

### 2. `arm-template-builder.ts` — landing zone empty resources guard

**Files:** `functions/src/modules/deployments/arm-template-builder.ts`

`buildLandingZone` returns an empty `resources: []` array when all three `includeNetwork`, `includeSecurity`, `includeMonitoring` flags are false/absent. ARM rejects a deployment with zero resources.

Fix: throw at the end of `buildLandingZone` before returning:
```typescript
if (resources.length === 0) {
  throw new Error("Landing zone requires at least one of: includeNetwork, includeSecurity, includeMonitoring");
}
```
This is a Zod-validated input path so this constitutes a malformed message → `processDeployment.ts` will catch it as a Zod-class error and return early (no retry).

**Note:** The throw must be caught in `processDeployment.ts` under the "validation-like" early-return path, not the "executor error → throw for retry" path. Since the message was valid JSON and passed schema validation, the landing zone config itself is the invalid input. Add a specific catch for this error class in `processDeployment.ts` to log and return (same pattern as Zod failures).

---

### 3. `arm-template-builder.ts` — ARM `secureString` for passwords

**Files:** `functions/src/modules/deployments/arm-template-builder.ts`, `functions/src/modules/deployments/bicep-executor.ts`

`buildPostgresServer` and `buildSqlServer` inline `administratorLoginPassword` as plaintext in the ARM resource `properties` object. ARM deployment history retains the full template body — anyone with Reader access to the resource group can see the password.

Fix: move passwords to ARM template `parameters` as `secureString` type. ARM redacts `secureString` parameter values from deployment history.

**Implementation approach:**

Add `_deployParameters?: Record<string, { value: string }>` to the `ArmTemplate` type. This field is:
- Populated by builders that generate passwords (Postgres, SQL)
- Stripped by `bicep-executor.ts` before the template is sent to ARM
- Passed separately as the `properties.parameters` object in the deployment call

Template shape (what gets sent to ARM):
```json
{
  "parameters": {
    "pgAdminPassword": { "type": "secureString" }
  },
  "resources": [{
    "properties": {
      "administratorLogin": "pgadmin",
      "administratorLoginPassword": "[parameters('pgAdminPassword')]"
    }
  }]
}
```

Deployment call shape:
```typescript
{
  properties: {
    mode: "Incremental",
    template: armTemplate,           // without _deployParameters
    parameters: {
      pgAdminPassword: { value: "generated-password" }
    }
  }
}
```

Parameter name conventions:
- PostgreSQL: `pgAdminPassword`
- SQL Server: `sqlAdminPassword`

When multiple password-bearing resources exist (e.g. `full-stack-web-app` has both SQL and storage), each gets its own named parameter. No collisions — SQL and Postgres use distinct parameter names.

---

### 4. `arm-template-builder.ts` — SQL API version to stable GA

**Files:** `functions/src/modules/deployments/arm-template-builder.ts`

`Microsoft.Sql/servers` uses `"2022-05-01-preview"`. Preview API versions can be withdrawn without notice.

Fix: change to `"2021-11-01"` (stable GA).

---

### 5. `processPoisonDeployment.ts` — blob write error swallowed, not caught

**Files:** `functions/src/functions/processPoisonDeployment.ts`

`createFailureRecord(...)` is called without error handling. If blob storage write fails (network error, missing container, wrong connection string), the poison handler throws → Functions runtime retries the dead-letter message indefinitely.

Fix: wrap `createFailureRecord` in try/catch. Log the error (structured), then return. The poison handler is a dead-letter sink and must never trigger retries.

```typescript
try {
  await createFailureRecord(/* ... */);
} catch (err) {
  context.error("processPoisonDeployment: failed to write failure record", { err });
}
```

---

### 6. New: `sanitize.test.ts`

**Files:** `functions/src/__tests__/modules/deployments/sanitize.test.ts` (new)

All three sanitize functions currently have zero dedicated unit tests. They are tested only indirectly through builder tests, which miss edge cases.

Test matrix per function:

| Input | `sanitizeStorageName` | `sanitizeKeyVaultName` | `sanitizeGenericName` |
|---|---|---|---|
| `""` | `""` | `""` | `""` |
| `"!!!"` | `""` | `""` | `""` |
| `"a!"` | `""` | `""` | `""` |
| `"ab"` | `""` | `""` | `""` |
| `"abc"` | `"abc"` | `"abc"` | `"abc"` |
| `"My App"` | `"myapp"` | `"my-app"` | `"my-app"` |
| `"---abc"` | `"abc"` | `"abc"` | `"abc"` |
| `"abc---"` | `"abc"` | `"abc"` | `"abc"` |
| `"a--b"` | `"ab"` | `"a-b"` | `"a-b"` |
| 100-char string | truncated to 24 | truncated to 24 | truncated to `maxLen` |
| `"123vault"` | n/a | strips leading non-alpha → `"vault"` | n/a |

---

## Error Handling Invariants (unchanged)

- Zod validation failure in `processDeployment.ts` → log + return (no retry)
- ARM/executor errors → throw (runtime retries → poison queue)
- Landing zone empty resources → treated as validation-like failure → log + return (no retry)
- Poison handler → must never throw under any circumstance

---

## Files Changed

| File | Change |
|---|---|
| `functions/src/modules/deployments/sanitize.ts` | Add min-length guards to `sanitizeKeyVaultName` and `sanitizeGenericName` |
| `functions/src/modules/deployments/arm-template-builder.ts` | Landing zone guard, secureString params for SQL+Postgres, SQL API version bump |
| `functions/src/modules/deployments/bicep-executor.ts` | Strip `_deployParameters` from template, pass as ARM deployment parameters |
| `functions/src/functions/processPoisonDeployment.ts` | Wrap `createFailureRecord` in try/catch |
| `functions/src/__tests__/modules/deployments/sanitize.test.ts` | New — full unit tests for all three sanitize functions |

No web-layer changes. No schema changes. No CI/CD changes.

---

## Out of Scope

- Auth / `getCurrentUser()` fallback (SSO on hold by design)
- MSAL plumbing
- Frontend UI fixes (separate concern)
- Queue message schema version field
- Service Bus SKU `tier` field
