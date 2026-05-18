# Deployment Pipeline Reliability Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 6 confirmed bugs in the Functions deployment pipeline that cause silent ARM failures or security exposure, and add dedicated sanitize unit tests.

**Architecture:** All changes in `functions/src/`. Two new exports from `arm-template-builder.ts` (`InvalidDeploymentConfigError`, `_deployParameters` field on `ArmTemplate`). A `deployParams` accumulator object threads through the builder call chain so password builders can register secureString values without changing return types. `bicep-executor.ts` strips the accumulator before the ARM PUT and passes it as `properties.parameters`.

**Tech Stack:** TypeScript, Vitest, Azure Functions v4, Azure ARM REST API

---

## File Map

| File | Change |
|---|---|
| `functions/src/modules/deployments/sanitize.ts` | Add `result.length >= 3 ? result : ""` guard to `sanitizeKeyVaultName` and `sanitizeGenericName` |
| `functions/src/modules/deployments/arm-template-builder.ts` | Add `InvalidDeploymentConfigError`; add `_deployParameters` to `ArmTemplate`; add `deployParams` accumulator param to `buildPostgresServer`, `buildSqlServer`, `buildFullStackWebApp`, `buildTemplateResources`, `buildCustomResources`; update `buildArmTemplate` to collect and attach params; add empty-resources guard to `buildLandingZone`; SQL API version → `2021-11-01` |
| `functions/src/modules/deployments/bicep-executor.ts` | Destructure `_deployParameters` from template before fetch; pass as `properties.parameters` |
| `functions/src/functions/processDeployment.ts` | Import `InvalidDeploymentConfigError`; wrap executor call; catch and return (no retry) on invalid config |
| `functions/src/functions/processPoisonDeployment.ts` | Wrap `createFailureRecord` in try/catch; log error, do not rethrow |
| `functions/src/__tests__/modules/deployments/sanitize.test.ts` | **New** — unit tests for all three sanitize functions |
| `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts` | Update landing zone "no flags" test to expect throw instead of empty array |

---

## Task 1: Sanitize min-length guards (TDD)

**Files:**
- Modify: `functions/src/modules/deployments/sanitize.ts`
- Create: `functions/src/__tests__/modules/deployments/sanitize.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `functions/src/__tests__/modules/deployments/sanitize.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  sanitizeStorageName,
  sanitizeKeyVaultName,
  sanitizeGenericName,
} from "../../../modules/deployments/sanitize.js";

describe("sanitizeStorageName", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeStorageName("")).toBe("");
  });
  it("returns empty string for all-special-char input", () => {
    expect(sanitizeStorageName("!!!")).toBe("");
  });
  it("returns empty string for 1-char result", () => {
    expect(sanitizeStorageName("a!!")).toBe("");
  });
  it("returns empty string for 2-char result", () => {
    expect(sanitizeStorageName("ab!")).toBe("");
  });
  it("keeps 3-char result", () => {
    expect(sanitizeStorageName("abc")).toBe("abc");
  });
  it("lowercases and strips non-alphanumeric", () => {
    expect(sanitizeStorageName("My-Storage!")).toBe("mystorage");
  });
  it("truncates to 24 chars", () => {
    expect(sanitizeStorageName("a".repeat(30))).toBe("a".repeat(24));
  });
});

describe("sanitizeKeyVaultName", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeKeyVaultName("")).toBe("");
  });
  it("returns empty string for all-special-char input", () => {
    expect(sanitizeKeyVaultName("!!!")).toBe("");
  });
  it("returns empty string for 1-char result after stripping", () => {
    // "a!!" → "a-" → trailing strip → "a" → length 1 < 3 → ""
    expect(sanitizeKeyVaultName("a!!")).toBe("");
  });
  it("returns empty string for 2-char result after stripping", () => {
    // "ab!" → "ab-" → "ab" → length 2 < 3 → ""
    expect(sanitizeKeyVaultName("ab!")).toBe("");
  });
  it("keeps 3-char result", () => {
    expect(sanitizeKeyVaultName("abc")).toBe("abc");
  });
  it("strips leading non-alpha characters", () => {
    // "123vault" → strip leading digits → "vault"
    expect(sanitizeKeyVaultName("123vault")).toBe("vault");
  });
  it("returns empty string when input is only digits", () => {
    // "123" → strip leading non-alpha → "" → ""
    expect(sanitizeKeyVaultName("123")).toBe("");
  });
  it("collapses consecutive hyphens", () => {
    expect(sanitizeKeyVaultName("a--b")).toBe("a-b");
  });
  it("strips trailing hyphens", () => {
    expect(sanitizeKeyVaultName("abc---")).toBe("abc");
  });
  it("converts spaces and special chars to hyphens", () => {
    expect(sanitizeKeyVaultName("my vault!")).toBe("my-vault");
  });
  it("truncates to 24 chars", () => {
    expect(sanitizeKeyVaultName("a".repeat(30))).toHaveLength(24);
  });
});

describe("sanitizeGenericName", () => {
  it("returns empty string for empty input", () => {
    expect(sanitizeGenericName("", 63)).toBe("");
  });
  it("returns empty string for all-special-char input", () => {
    expect(sanitizeGenericName("!!!", 63)).toBe("");
  });
  it("returns empty string for 1-char result", () => {
    // "a!!" → "a--" → collapse → "a-" → strip trailing → "a" → length 1 < 3 → ""
    expect(sanitizeGenericName("a!!", 63)).toBe("");
  });
  it("returns empty string for 2-char result", () => {
    // "ab!" → "ab-" → strip trailing → "ab" → length 2 < 3 → ""
    expect(sanitizeGenericName("ab!", 63)).toBe("");
  });
  it("keeps 3-char result", () => {
    expect(sanitizeGenericName("abc", 63)).toBe("abc");
  });
  it("converts spaces and special chars to hyphens", () => {
    expect(sanitizeGenericName("My App Name", 63)).toBe("my-app-name");
  });
  it("collapses consecutive hyphens", () => {
    expect(sanitizeGenericName("a--b", 63)).toBe("a-b");
  });
  it("strips leading hyphens", () => {
    expect(sanitizeGenericName("---abc", 63)).toBe("abc");
  });
  it("strips trailing hyphens", () => {
    expect(sanitizeGenericName("abc---", 63)).toBe("abc");
  });
  it("respects maxLen parameter", () => {
    expect(sanitizeGenericName("a".repeat(80), 63).length).toBeLessThanOrEqual(63);
  });
  it("respects smaller maxLen", () => {
    expect(sanitizeGenericName("a".repeat(30), 10).length).toBeLessThanOrEqual(10);
  });
});
```

- [ ] **Step 2: Run — expect failures on KV and generic 1/2-char tests**

```
cd functions && npx vitest run sanitize.test
```

Expected: `sanitizeKeyVaultName` and `sanitizeGenericName` tests for 1-char and 2-char results FAIL (they return `"a"` and `"ab"` currently, expected `""`).

- [ ] **Step 3: Fix `sanitize.ts`**

Replace the entire file:

```typescript
export function sanitizeStorageName(base: string): string {
  const result = base.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 24);
  return result.length >= 3 ? result : "";
}

export function sanitizeKeyVaultName(base: string): string {
  const result = base
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[^a-z]+/, "")
    .replace(/-+$/, "")
    .slice(0, 24);
  return result.length >= 3 ? result : "";
}

export function sanitizeGenericName(base: string, maxLen: number): string {
  const result = base
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLen);
  return result.length >= 3 ? result : "";
}
```

- [ ] **Step 4: Run — all sanitize tests pass**

```
cd functions && npx vitest run sanitize.test
```

Expected: all pass.

- [ ] **Step 5: Run full functions test suite — no regressions**

```
cd functions && npx vitest run
```

Expected: all pass (existing builder tests use names ≥ 3 chars or already-empty fallbacks — no behavior change for them).

- [ ] **Step 6: Commit**

```
git add functions/src/modules/deployments/sanitize.ts functions/src/__tests__/modules/deployments/sanitize.test.ts
git commit -m "fix(functions): add min-length guard to sanitizeKeyVaultName and sanitizeGenericName"
```

---

## Task 2: Landing zone empty-resources guard

**Files:**
- Modify: `functions/src/modules/deployments/arm-template-builder.ts`
- Modify: `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`

- [ ] **Step 1: Write failing test first**

In `arm-template-builder.test.ts`, update the existing "returns empty resources when no flags set" test in the `buildLandingZone` describe block:

```typescript
// Replace:
it("returns empty resources when no flags set", () => {
  const t = buildArmTemplate(templatePayload("landing-zone", {}), { tenantId: TENANT_ID });
  expect(t.resources).toHaveLength(0);
});

// With:
it("throws when no flags set", () => {
  expect(() =>
    buildArmTemplate(templatePayload("landing-zone", {}), { tenantId: TENANT_ID })
  ).toThrow("Landing zone requires at least one");
});
```

Also update the import at the top of the test file to include `InvalidDeploymentConfigError`:

```typescript
import { buildArmTemplate, validateTemplateAgainstPolicy, InvalidDeploymentConfigError } from "../../../modules/deployments/arm-template-builder.js";
```

- [ ] **Step 2: Run — expect this test to fail**

```
cd functions && npx vitest run arm-template-builder.test
```

Expected: the updated "throws when no flags set" test FAILS (currently returns `[]` instead of throwing).

- [ ] **Step 3: Add `InvalidDeploymentConfigError` and guard to `arm-template-builder.ts`**

After the `PolicyBlockedTemplateError` class (around line 107), add:

```typescript
export class InvalidDeploymentConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDeploymentConfigError";
  }
}
```

In `buildLandingZone`, add the guard before the `return resources` on line 527:

```typescript
  if (resources.length === 0) {
    throw new InvalidDeploymentConfigError(
      "Landing zone requires at least one of: includeNetwork, includeSecurity, includeMonitoring"
    );
  }

  return resources;
```

- [ ] **Step 4: Run — all tests pass**

```
cd functions && npx vitest run arm-template-builder.test
```

Expected: all pass.

- [ ] **Step 5: Commit**

```
git add functions/src/modules/deployments/arm-template-builder.ts functions/src/__tests__/modules/deployments/arm-template-builder.test.ts
git commit -m "fix(functions): throw InvalidDeploymentConfigError for empty landing zone config"
```

---

## Task 3: secureString passwords for PostgreSQL and SQL + SQL API version

**Files:**
- Modify: `functions/src/modules/deployments/arm-template-builder.ts`

- [ ] **Step 1: Add `_deployParameters` to `ArmTemplate` interface**

Change the `ArmTemplate` interface (lines 71–77) to:

```typescript
interface ArmTemplate {
  $schema: string;
  contentVersion: string;
  parameters: Record<string, unknown>;
  resources: ArmResource[];
  outputs: Record<string, unknown>;
  _deployParameters?: Record<string, { value: string }>;
}
```

- [ ] **Step 2: Update `buildPostgresServer` signature and body**

Replace the entire `buildPostgresServer` function:

```typescript
function buildPostgresServer(
  name: string,
  location: string,
  config: Record<string, unknown>,
  deployParams: Record<string, { value: string }>
): ArmResource {
  const safeName = sanitizeGenericName(name, 63) || "sandbox-db";
  const storageSizeGB =
    typeof config.storageGB === "number" ? config.storageGB : 32;

  deployParams["pgAdminPassword"] = { value: generatePassword() };

  return {
    type: "Microsoft.DBforPostgreSQL/flexibleServers",
    apiVersion: "2023-12-01",
    name: safeName,
    location,
    sku: { name: "Standard_B1ms", tier: "Burstable" },
    properties: {
      version: typeof config.engineVersion === "string" ? config.engineVersion : "16",
      storage: { storageSizeGB },
      backup: {
        backupRetentionDays: config.enableBackup !== false ? 7 : 1,
        geoRedundantBackup: "Disabled",
      },
      administratorLogin: "sandboxadmin",
      administratorLoginPassword: "[parameters('pgAdminPassword')]",
      highAvailability: { mode: "Disabled" },
    },
  };
}
```

- [ ] **Step 3: Update `buildSqlServer` signature, body, and API version**

Replace the entire `buildSqlServer` function:

```typescript
function buildSqlServer(
  serverName: string,
  dbName: string,
  location: string,
  config: Record<string, unknown>,
  deployParams: Record<string, { value: string }>
): ArmResource[] {
  const safeServer = sanitizeGenericName(serverName, 63) || "sandbox-sql";
  const safeDb = sanitizeGenericName(dbName, 128) || "appdb";
  const adminUser =
    typeof config.adminUser === "string" && config.adminUser.length > 0
      ? config.adminUser
      : "sandboxadmin";
  const adminPassword =
    typeof config.adminPassword === "string" && config.adminPassword.length > 0
      ? config.adminPassword
      : generatePassword();
  const dbSku = typeof config.dbSku === "string" ? config.dbSku : "Basic";

  deployParams["sqlAdminPassword"] = { value: adminPassword };

  return [
    {
      type: "Microsoft.Sql/servers",
      apiVersion: "2021-11-01",
      name: safeServer,
      location,
      properties: {
        administratorLogin: adminUser,
        administratorLoginPassword: "[parameters('sqlAdminPassword')]",
        version: "12.0",
      },
    },
    {
      type: "Microsoft.Sql/servers/databases",
      apiVersion: "2021-11-01",
      name: `${safeServer}/${safeDb}`,
      location,
      dependsOn: [`[resourceId('Microsoft.Sql/servers', '${safeServer}')]`],
      sku: { name: dbSku },
      properties: {
        collation: "SQL_Latin1_General_CP1_CI_AS",
      },
    },
  ];
}
```

- [ ] **Step 4: Update `buildFullStackWebApp` to accept and thread `deployParams`**

Replace the `buildFullStackWebApp` function signature and `buildSqlServer` call:

```typescript
function buildFullStackWebApp(
  name: string,
  location: string,
  config: Record<string, unknown>,
  tenantId: string,
  suffix = "",
  deployParams: Record<string, { value: string }>
): ArmResource[] {
  const baseName = sanitizeGenericName(name, 35) || "sandbox-app";

  const appResources = buildWebApplication(baseName, location, config);

  const sqlResources = buildSqlServer(
    `${baseName}-sql`,
    "appdb",
    location,
    {
      adminUser: config.sqlAdminUser,
      adminPassword: config.sqlAdminPassword,
      dbSku: config.dbSku,
    },
    deployParams
  );

  const storageResource = buildStorageAccount(baseName, location, {
    redundancy: config.storageTier,
  }, suffix);

  const kvResource = buildKeyVault(`${baseName}-kv`, location, {
    kvSku: config.kvSku,
  }, tenantId, suffix);

  return [...appResources, ...sqlResources, storageResource, kvResource];
}
```

- [ ] **Step 5: Update `buildTemplateResources` to accept and thread `deployParams`**

Change the function signature and update the two cases that call password-using builders:

```typescript
function buildTemplateResources(
  template: { slug: string; formValues: Record<string, unknown> },
  tenantId: string,
  suffix = "",
  deployParams: Record<string, { value: string }>
): ArmResource[] {
```

In the switch body, update these two cases (leave all others unchanged):

```typescript
    case "database":
      return [
        buildPostgresServer(
          typeof formValues.dbName === "string" ? formValues.dbName : "sandbox-db",
          location,
          formValues,
          deployParams
        ),
      ];
```

```typescript
    case "full-stack-web-app":
      return buildFullStackWebApp(
        typeof formValues.appName === "string" ? formValues.appName : "sandbox-app",
        location,
        formValues,
        tenantId,
        suffix,
        deployParams
      );
```

- [ ] **Step 6: Update `buildCustomResources` to accept and thread `deployParams`**

Change the function signature and update the two cases:

```typescript
function buildCustomResources(
  resources: Array<{
    type: string;
    name: string;
    icon: string;
    config: Record<string, unknown>;
  }>,
  tenantId: string,
  suffix = "",
  deployParams: Record<string, { value: string }>
): ArmResource[] {
```

Update these two cases (leave all others unchanged):

```typescript
      case "Microsoft.DBforPostgreSQL/flexibleServers":
        armResources.push(buildPostgresServer(resource.name, location, resource.config, deployParams));
        break;
```

```typescript
      case "Microsoft.Sql/servers":
        armResources.push(...buildSqlServer(resource.name, "appdb", location, resource.config, deployParams));
        break;
```

- [ ] **Step 7: Update `buildArmTemplate` to create accumulator and build `parameters`**

Replace the `buildArmTemplate` function body:

```typescript
export function buildArmTemplate(
  payload: DeploymentPayload,
  opts: { tenantId: string; tags?: Record<string, string>; submissionId?: string }
): ArmTemplate {
  const uniqueSuffix = (opts.submissionId ?? "").replace(/-/g, "").slice(0, 8);
  const deployParams: Record<string, { value: string }> = {};

  const resources =
    payload.mode === "template"
      ? buildTemplateResources(payload.template, opts.tenantId, uniqueSuffix, deployParams)
      : buildCustomResources(payload.resources, opts.tenantId, uniqueSuffix, deployParams);

  const taggedResources = opts.tags
    ? resources.map((r) => ({ ...r, tags: opts.tags }))
    : resources;

  const parameters: Record<string, unknown> = Object.fromEntries(
    Object.keys(deployParams).map((k) => [k, { type: "secureString" }])
  );

  return {
    $schema:
      "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    contentVersion: "1.0.0.0",
    parameters,
    resources: taggedResources,
    outputs: {},
    ...(Object.keys(deployParams).length > 0 && { _deployParameters: deployParams }),
  };
}
```

- [ ] **Step 8: Run — all tests pass**

```
cd functions && npx vitest run
```

Expected: all pass. Note: the test `"parameters and outputs are empty objects"` uses `storage-account` (no passwords), so `parameters` stays `{}`. Tests for database/SQL don't assert on `parameters` content.

- [ ] **Step 9: Type check**

```
cd functions && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 10: Commit**

```
git add functions/src/modules/deployments/arm-template-builder.ts
git commit -m "fix(functions): move SQL/PostgreSQL passwords to ARM secureString parameters; bump SQL API to 2021-11-01"
```

---

## Task 4: `bicep-executor.ts` — pass `_deployParameters` to ARM

**Files:**
- Modify: `functions/src/modules/deployments/bicep-executor.ts`

- [ ] **Step 1: Update the ARM fetch body to strip `_deployParameters` and pass as ARM parameters**

In `bicep-executor.ts`, find the `body: JSON.stringify({...})` block around lines 104–110. Replace it:

```typescript
  const { _deployParameters, ...armTemplate } = template;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${tokenResult.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        mode: "Incremental",
        template: armTemplate as unknown as Record<string, unknown>,
        parameters: _deployParameters ?? {},
      },
    }),
  });
```

The `const template = buildArmTemplate(...)` line and `validateTemplateAgainstPolicy(template)` call are unaffected — `template` still has the `_deployParameters` field, but `validateTemplateAgainstPolicy` only reads `template.resources` so it works fine.

- [ ] **Step 2: Run full suite + type check**

```
cd functions && npx vitest run && npx tsc --noEmit
```

Expected: all tests pass, 0 type errors.

- [ ] **Step 3: Commit**

```
git add functions/src/modules/deployments/bicep-executor.ts
git commit -m "fix(functions): strip _deployParameters from ARM template body; pass as deployment parameters"
```

---

## Task 5: `processDeployment.ts` — no retry on `InvalidDeploymentConfigError`

**Files:**
- Modify: `functions/src/functions/processDeployment.ts`
- Modify: `functions/src/__tests__/functions/processDeployment.test.ts`

- [ ] **Step 1: Write failing test**

In `processDeployment.test.ts`, add to the describe block:

```typescript
  it("returns without throwing when executor throws InvalidDeploymentConfigError", async () => {
    const { InvalidDeploymentConfigError } = await import(
      "../../modules/deployments/arm-template-builder.js"
    );
    executeBicepDeployment.mockRejectedValue(
      new InvalidDeploymentConfigError("Landing zone requires at least one")
    );
    const ctx = makeContext();
    await expect(processDeployment(validMessage, ctx)).resolves.toBeUndefined();
    expect(ctx.error).toHaveBeenCalledWith(
      expect.stringContaining("invalid config")
    );
  });
```

- [ ] **Step 2: Run — expect this test to fail**

```
cd functions && npx vitest run processDeployment.test
```

Expected: the new test FAILS (currently the error propagates and rejects).

- [ ] **Step 3: Update `processDeployment.ts`**

Add the import at the top:

```typescript
import { InvalidDeploymentConfigError } from "../modules/deployments/arm-template-builder.js";
```

Replace the `await executeBicepDeployment({...})` call (lines 50–59) with:

```typescript
  try {
    await executeBicepDeployment({
      subscriptionId: env.AZURE_SUBSCRIPTION_ID,
      resourceGroupName,
      deploymentName: submissionId,
      payload,
      location,
      tags,
      deployedBy,
      log: (msg) => context.log(msg),
    });
  } catch (err) {
    if (err instanceof InvalidDeploymentConfigError) {
      context.error(`Deployment ${submissionId} has invalid config: ${err.message}`);
      return;
    }
    throw err;
  }
```

- [ ] **Step 4: Run — all tests pass**

```
cd functions && npx vitest run processDeployment.test
```

Expected: all 5 tests pass, including the new one. The "propagates executor errors" test still passes because a plain `Error` is rethrown.

- [ ] **Step 5: Commit**

```
git add functions/src/functions/processDeployment.ts functions/src/__tests__/functions/processDeployment.test.ts
git commit -m "fix(functions): catch InvalidDeploymentConfigError in processDeployment — log and return, no retry"
```

---

## Task 6: `processPoisonDeployment.ts` — blob write error handling

**Files:**
- Modify: `functions/src/functions/processPoisonDeployment.ts`

- [ ] **Step 1: Wrap `createFailureRecord` in try/catch**

Replace lines 76–84 (the `await createFailureRecord(...)` and `context.log(...)` after it):

```typescript
  try {
    await createFailureRecord(env.AZURE_STORAGE_CONNECTION_STRING, {
      submissionId,
      resourceGroupName,
      error: armError,
      deployedBy,
      failedAt: new Date().toISOString(),
    });
    context.log(`Failure recorded for ${submissionId}`);
  } catch (err) {
    context.error(
      `processPoisonDeployment: failed to write failure record for ${submissionId}: ${err instanceof Error ? err.message : String(err)}`
    );
  }
```

- [ ] **Step 2: Run full suite + type check**

```
cd functions && npx vitest run && npx tsc --noEmit
```

Expected: all pass, 0 errors.

- [ ] **Step 3: Commit**

```
git add functions/src/functions/processPoisonDeployment.ts
git commit -m "fix(functions): wrap createFailureRecord in try/catch — poison handler must never throw"
```

---

## Task 7: Final validation

- [ ] **Step 1: Full test suite**

```
cd functions && npx vitest run
```

Expected: all tests pass. Count should be higher than before (new sanitize tests + new processDeployment test).

- [ ] **Step 2: TypeScript**

```
cd functions && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Verify no web-layer breakage**

```
cd web && npx tsc --noEmit && npx vitest run
```

Expected: 0 errors, all pass (no web-layer changes were made).
