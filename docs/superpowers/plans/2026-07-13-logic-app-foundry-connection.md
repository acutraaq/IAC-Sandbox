# Logic App Foundry Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every `logic-app` and `logic-app-storage` deployment automatically provisions a pre-authenticated Azure OpenAI (Foundry) API connection, so users pick an existing connection in the Logic App Designer instead of configuring one themselves.

**Architecture:** One new builder function (`buildAzureOpenAiConnection`) emits a `Microsoft.Web/connections` resource (API-key auth) alongside the existing Logic App resource(s). The key/resource name are threaded through as plain values from Function App env vars (`FOUNDRY_API_KEY`, `FOUNDRY_RESOURCE_NAME`) — following the exact same dependency-injection pattern `tenantId` already uses (read from `env` in `bicep-executor.ts`, passed into `buildArmTemplate`'s `opts`, never read from `env` inside `arm-template-builder.ts` itself).

**Tech Stack:** TypeScript, Zod (env validation), Vitest.

## Global Constraints

- TypeScript strict mode — no `any`, no unguarded type assertions (per CLAUDE.md Coding Conventions)
- No secrets in code or logs — env vars only (per CLAUDE.md Coding Conventions) — this is why the API key goes through a Function App env var, not a literal in source
- `functions/src/modules/deployments/deployment.schema.ts` must stay in sync with `web/lib/deployments/schema.ts` — not applicable to this plan (no schema changes)
- Full gate after every task that touches `functions/`: `npx tsc --noEmit` + `npx vitest run`, both run from `functions/` (never repo root)
- Full gate after the task that touches `web/`: `npx vitest run` + `npx tsc --noEmit` + `npm run build`, run from `web/`

---

### Task 1: Add `FOUNDRY_API_KEY` / `FOUNDRY_RESOURCE_NAME` required env vars

**Files:**
- Modify: `functions/src/lib/env.ts`
- Modify: `functions/src/__tests__/lib/env.test.ts`

**Interfaces:**
- Produces: `env.FOUNDRY_API_KEY: string`, `env.FOUNDRY_RESOURCE_NAME: string` — consumed by Task 3 (bicep-executor.ts).

- [ ] **Step 1: Write the failing tests**

Add two new keys to `baseEnv` in `functions/src/__tests__/lib/env.test.ts` (this file's `clearEnv()` already iterates `Object.keys(baseEnv)` generically, so no other change is needed there), and add two new `it()` blocks mirroring the existing "throws when X is missing" pattern:

```typescript
const baseEnv = {
  NODE_ENV: "test",
  AZURE_SUBSCRIPTION_ID: "00000000-0000-0000-0000-000000000000",
  AZURE_TENANT_ID: "00000000-0000-0000-0000-000000000000",
  DEPLOYMENT_QUEUE: "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=FQ==",
  AZURE_STORAGE_CONNECTION_STRING: "DefaultEndpointsProtocol=https;AccountName=test;AccountKey=FQ==",
  FOUNDRY_API_KEY: "test-foundry-key",
  FOUNDRY_RESOURCE_NAME: "test-foundry-resource",
};
```

Add these two tests after the existing `"throws when AZURE_STORAGE_CONNECTION_STRING is empty"` test:

```typescript
  it("throws when FOUNDRY_API_KEY is missing", async () => {
    vi.resetModules();
    clearEnv();
    const vars = { ...baseEnv };
    delete (vars as Record<string, unknown>).FOUNDRY_API_KEY;
    Object.assign(process.env, vars);
    const { default: env } = await import("../../lib/env.js");
    expect(() => env.FOUNDRY_API_KEY).toThrow("Invalid environment variables");
  });

  it("throws when FOUNDRY_RESOURCE_NAME is missing", async () => {
    vi.resetModules();
    clearEnv();
    const vars = { ...baseEnv };
    delete (vars as Record<string, unknown>).FOUNDRY_RESOURCE_NAME;
    Object.assign(process.env, vars);
    const { default: env } = await import("../../lib/env.js");
    expect(() => env.FOUNDRY_RESOURCE_NAME).toThrow("Invalid environment variables");
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from `functions/`): `npx vitest run src/__tests__/lib/env.test.ts`
Expected: the 2 new tests FAIL (schema doesn't yet know about these keys, so `env.FOUNDRY_API_KEY` returns `undefined` instead of throwing — no throw means the `.toThrow()` assertion fails).

- [ ] **Step 3: Add the two fields to the schema**

In `functions/src/lib/env.ts`, add to `envSchema`:

```typescript
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  AZURE_SUBSCRIPTION_ID: z.string().min(1, "AZURE_SUBSCRIPTION_ID is required"),
  AZURE_TENANT_ID: z.string().min(1, "AZURE_TENANT_ID is required"),
  DEPLOYMENT_QUEUE: z.string().min(1, "DEPLOYMENT_QUEUE is required"),
  AZURE_STORAGE_CONNECTION_STRING: z.string().min(1, "AZURE_STORAGE_CONNECTION_STRING is required"),
  FOUNDRY_API_KEY: z.string().min(1, "FOUNDRY_API_KEY is required"),
  FOUNDRY_RESOURCE_NAME: z.string().min(1, "FOUNDRY_RESOURCE_NAME is required"),
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run (from `functions/`): `npx vitest run src/__tests__/lib/env.test.ts`
Expected: all tests PASS (existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add functions/src/lib/env.ts functions/src/__tests__/lib/env.test.ts
git commit -m "feat: add FOUNDRY_API_KEY and FOUNDRY_RESOURCE_NAME required env vars"
```

---

### Task 2: Add `Microsoft.Web/connections` to the policy allow-list

**Files:**
- Modify: `functions/src/modules/deployments/arm-template-builder.ts:35-50`

**Interfaces:**
- Consumes: none (standalone data change).
- Produces: `POLICY_ALLOWED_RESOURCE_TYPES` now includes `"Microsoft.Web/connections"` — consumed by `validateTemplateAgainstPolicy()`, and required by Task 3's new resource type or every assertion in Task 3 that calls `buildArmTemplate` for `logic-app`/`logic-app-storage` will start failing `validateTemplateAgainstPolicy` (note: `buildArmTemplate` itself doesn't call `validateTemplateAgainstPolicy` — only `bicep-executor.ts` does — so this step doesn't break Task 3's tests, but must land before Task 4's `bicep-executor.test.ts` tests, which do exercise the real deployment path including policy validation).

- [ ] **Step 1: Write the failing test**

In `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`, add this test inside the existing `describe("validateTemplateAgainstPolicy", ...)` block (after the existing two tests):

```typescript
  it("allows Microsoft.Web/connections", () => {
    const t = buildArmTemplate(customPayload("Microsoft.Web/staticSites", "app"), { tenantId: TENANT_ID });
    t.resources.push({
      type: "Microsoft.Web/connections",
      apiVersion: "2016-06-01",
      name: "test-conn",
      location: "malaysiawest",
    });
    expect(validateTemplateAgainstPolicy(t)).not.toContain("Microsoft.Web/connections");
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `functions/`): `npx vitest run src/__tests__/modules/deployments/arm-template-builder.test.ts -t "allows Microsoft.Web/connections"`
Expected: FAIL — `validateTemplateAgainstPolicy` returns `["Microsoft.Web/connections"]`, so `.not.toContain(...)` fails.

- [ ] **Step 3: Add the resource type to the allow-list**

In `functions/src/modules/deployments/arm-template-builder.ts`, modify the `POLICY_ALLOWED_RESOURCE_TYPES` set:

```typescript
const POLICY_ALLOWED_RESOURCE_TYPES = new Set([
  "Microsoft.Web/sites",
  "Microsoft.Web/serverfarms",
  "Microsoft.DBforPostgreSQL/flexibleServers",
  "Microsoft.Storage/storageAccounts",
  "Microsoft.Network/virtualNetworks",
  "Microsoft.KeyVault/vaults",
  "Microsoft.App/containerApps",
  "Microsoft.App/managedEnvironments",
  "Microsoft.Web/staticSites",
  "Microsoft.Logic/workflows",
  "Microsoft.ServiceBus/namespaces",
  "Microsoft.EventGrid/topics",
  "Microsoft.Sql/servers",
  "Microsoft.Sql/servers/databases",
  "Microsoft.Web/connections",
]);
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `functions/`): `npx vitest run src/__tests__/modules/deployments/arm-template-builder.test.ts -t "allows Microsoft.Web/connections"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add functions/src/modules/deployments/arm-template-builder.ts functions/src/__tests__/modules/deployments/arm-template-builder.test.ts
git commit -m "feat: allow Microsoft.Web/connections in subscription policy allow-list"
```

---

### Task 3: Implement `buildAzureOpenAiConnection` and wire it into `logic-app` / `logic-app-storage`

**Files:**
- Modify: `functions/src/modules/deployments/arm-template-builder.ts`
- Modify: `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`

**Interfaces:**
- Consumes: `InvalidDeploymentConfigError` (already exported, defined at line 108), `sanitizeGenericName` (already imported), `ArmResource` type (already defined).
- Produces: `buildArmTemplate(payload, opts)` — `opts` gains two new **optional** fields: `foundryApiKey?: string`, `foundryResourceName?: string`. When `payload.template.slug` is `"logic-app"` or `"logic-app-storage"` and either is missing, `buildArmTemplate` throws `InvalidDeploymentConfigError`. Task 4 (`bicep-executor.ts`) always supplies both from `env`, so this only matters for direct/test callers.

This task is the core change. Read `functions/src/modules/deployments/arm-template-builder.ts` fully before starting — you're modifying `buildTemplateResources` (currently at line 527), adding a new builder function near `buildLogicApp` (currently at line 393), and modifying `buildArmTemplate`'s signature and its one call site for `buildTemplateResources` (currently at lines 721-731).

**Unverified assumption, flag before merging:** the `parameterValues` JSON keys used below (`azureOpenAIResourceName`, `azureOpenAIApiKey`) come from Microsoft's human-readable connector reference docs, not the literal JSON schema — Microsoft doesn't publish the exact property names in prose docs. Before this ships to a real deployment, confirm the actual keys via:

```
GET https://management.azure.com/subscriptions/{sub}/providers/Microsoft.Web/locations/malaysiawest/managedApis/azureopenai?api-version=2016-06-01
```

and check the `connectionParameters` object in the response. If the real keys differ, update `buildAzureOpenAiConnection` (Step 3 below) and the corresponding test assertions (Step 1) accordingly — this is a one-line find/replace either way, not a structural change.

- [ ] **Step 1: Write the failing tests**

In `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`, add a `FOUNDRY` constant right after the existing `TAGS` constant near the top of the file:

```typescript
const FOUNDRY = { foundryApiKey: "test-foundry-key", foundryResourceName: "test-foundry-resource" };
```

Replace the entire `describe("buildLogicAppTemplate (logic-app template)", ...)` block with:

```typescript
describe("buildLogicAppTemplate (logic-app template)", () => {
  it("returns 2 resources: Logic App with HTTP trigger and Azure OpenAI connection", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "my-workflow" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    expect(t.resources).toHaveLength(2);
    expect(t.resources[0].type).toBe("Microsoft.Logic/workflows");
    const def = (t.resources[0] as Record<string, unknown>).properties as { definition: { triggers: Record<string, unknown> } };
    expect(def.definition.triggers).toHaveProperty("manual");
  });

  it("sanitizes workflow name", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "My Workflow!!" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    expect(t.resources[0].name).toMatch(/^[a-z0-9-]+$/);
  });

  it("throws InvalidDeploymentConfigError when Foundry config is missing", () => {
    expect(() =>
      buildArmTemplate(templatePayload("logic-app", { workflowName: "my-workflow" }), { tenantId: TENANT_ID })
    ).toThrow(/Foundry API key\/resource name not configured/);
  });
});
```

Replace the entire `describe("buildLogicAppStorageTemplate (logic-app-storage template)", ...)` block with:

```typescript
describe("buildLogicAppStorageTemplate (logic-app-storage template)", () => {
  it("returns 3 resources: Logic App, Storage Account, and Azure OpenAI connection", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "my-workflow", storageAccountName: "mystorage" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    expect(t.resources).toHaveLength(3);
    const types = t.resources.map((r) => r.type);
    expect(types).toContain("Microsoft.Logic/workflows");
    expect(types).toContain("Microsoft.Storage/storageAccounts");
    expect(types).toContain("Microsoft.Web/connections");
  });

  it("sanitizes all resource names independently", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "My Workflow!!", storageAccountName: "My Storage!!" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    for (const r of t.resources) {
      expect(r.name).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("defaults storage account to LRS/Hot/private when no extra config given", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    const storage = t.resources.find((r) => r.type === "Microsoft.Storage/storageAccounts") as Record<string, unknown>;
    expect((storage.sku as { name: string }).name).toBe("Standard_LRS");
    const props = storage.properties as { accessTier: string; allowBlobPublicAccess: boolean };
    expect(props.accessTier).toBe("Hot");
    expect(props.allowBlobPublicAccess).toBe(false);
  });

  it("appends the submissionId suffix to the storage account name for global uniqueness", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID, submissionId: "123e4567-e89b-12d3-a456-426614174000", ...FOUNDRY }
    );
    const storage = t.resources.find((r) => r.type === "Microsoft.Storage/storageAccounts") as Record<string, unknown>;
    expect(storage.name).toBe("store123e4567");
  });

  it("does not collide when two deployments reuse the same storage account name with different submissionIds", () => {
    const first = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID, submissionId: "123e4567-e89b-12d3-a456-426614174000", ...FOUNDRY }
    );
    const second = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID, submissionId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", ...FOUNDRY }
    );
    const firstStorage = first.resources.find((r) => r.type === "Microsoft.Storage/storageAccounts") as Record<string, unknown>;
    const secondStorage = second.resources.find((r) => r.type === "Microsoft.Storage/storageAccounts") as Record<string, unknown>;
    expect(firstStorage.name).not.toBe(secondStorage.name);
  });

  it("throws InvalidDeploymentConfigError when Foundry config is missing", () => {
    expect(() =>
      buildArmTemplate(
        templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
        { tenantId: TENANT_ID }
      )
    ).toThrow(/Foundry API key\/resource name not configured/);
  });
});
```

Add this new `describe` block right after the `buildLogicAppStorageTemplate` block (before the `"Custom mode — Logic App"` section):

```typescript
// ---------------------------------------------------------------------------
// Azure OpenAI (Foundry) connection
// ---------------------------------------------------------------------------

describe("buildAzureOpenAiConnection (logic-app / logic-app-storage)", () => {
  it("builds a Microsoft.Web/connections resource with resource name and api key parameter", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "my-workflow" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    const conn = t.resources.find((r) => r.type === "Microsoft.Web/connections") as Record<string, unknown>;
    expect(conn).toBeDefined();
    const props = conn.properties as { parameterValues: { azureOpenAIResourceName: string; azureOpenAIApiKey: string } };
    expect(props.parameterValues.azureOpenAIResourceName).toBe(FOUNDRY.foundryResourceName);
    expect(props.parameterValues.azureOpenAIApiKey).toBe("[parameters('azureopenaiApiKey')]");
  });

  it("registers the api key as a secureString deploy parameter", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "my-workflow" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    expect(t.parameters.azureopenaiApiKey).toEqual({ type: "secureString" });
    expect(t._deployParameters?.azureopenaiApiKey).toEqual({ value: FOUNDRY.foundryApiKey });
  });

  it("is included for logic-app-storage too", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID, ...FOUNDRY }
    );
    const types = t.resources.map((r) => r.type);
    expect(types).toContain("Microsoft.Web/connections");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from `functions/`): `npx vitest run src/__tests__/modules/deployments/arm-template-builder.test.ts`
Expected: FAIL — `toHaveLength(2)`/`toHaveLength(3)` assertions fail (currently 1/2 resources), `buildAzureOpenAiConnection` tests fail (no `Microsoft.Web/connections` resource exists), `InvalidDeploymentConfigError` tests fail (no such error thrown today since `foundryApiKey`/`foundryResourceName` aren't recognized opts yet).

- [ ] **Step 3: Add `buildAzureOpenAiConnection` and the `requireFoundryConfig` helper**

In `functions/src/modules/deployments/arm-template-builder.ts`, add this new function immediately after `buildLogicApp` (which ends at line 445, right before the `// Static Web App builder` section comment):

```typescript
// ---------------------------------------------------------------------------
// Azure OpenAI (Foundry) connection builder
// ---------------------------------------------------------------------------
// Shared Foundry resource — one Azure OpenAI-compatible endpoint used by
// every logic-app / logic-app-storage deployment. API-key auth (not managed
// identity): simpler, no per-deployment role assignment on the Foundry
// resource. See docs/superpowers/specs/2026-07-13-logic-app-foundry-connection-design.md.
// ---------------------------------------------------------------------------

function requireFoundryConfig(
  apiKey: string | undefined,
  resourceName: string | undefined
): { apiKey: string; resourceName: string } {
  if (!apiKey || !resourceName) {
    throw new InvalidDeploymentConfigError(
      "Foundry API key/resource name not configured — set FOUNDRY_API_KEY and FOUNDRY_RESOURCE_NAME"
    );
  }
  return { apiKey, resourceName };
}

function buildAzureOpenAiConnection(
  name: string,
  location: string,
  resourceName: string,
  apiKey: string,
  deployParams: Record<string, { value: string }>
): ArmResource {
  const safeName = (sanitizeGenericName(name, 40) || "sandbox-workflow") + "-openai";
  deployParams["azureopenaiApiKey"] = { value: apiKey };

  return {
    type: "Microsoft.Web/connections",
    apiVersion: "2016-06-01",
    name: safeName,
    location,
    properties: {
      displayName: "Azure OpenAI (Foundry)",
      api: {
        id: `[concat(subscription().id, '/providers/Microsoft.Web/locations/${location}/managedApis/azureopenai')]`,
      },
      parameterValues: {
        azureOpenAIResourceName: resourceName,
        azureOpenAIApiKey: "[parameters('azureopenaiApiKey')]",
      },
    },
  };
}
```

- [ ] **Step 4: Update `buildTemplateResources` to accept and thread through the new params**

In `functions/src/modules/deployments/arm-template-builder.ts`, change the `buildTemplateResources` function signature (currently at line 527) from:

```typescript
function buildTemplateResources(
  template: { slug: string; formValues: Record<string, unknown> },
  suffix = ""
): ArmResource[] {
```

to:

```typescript
function buildTemplateResources(
  template: { slug: string; formValues: Record<string, unknown> },
  suffix = "",
  deployParams: Record<string, { value: string }> = {},
  foundryApiKey?: string,
  foundryResourceName?: string
): ArmResource[] {
```

Then replace the `"logic-app"` and `"logic-app-storage"` cases (currently lines 566-589) with:

```typescript
    case "logic-app": {
      const workflowName = typeof formValues.workflowName === "string" ? formValues.workflowName : "sandbox-workflow";
      const foundry = requireFoundryConfig(foundryApiKey, foundryResourceName);
      return [
        buildLogicApp(workflowName, location, formValues, "http"),
        buildAzureOpenAiConnection(workflowName, location, foundry.resourceName, foundry.apiKey, deployParams),
      ];
    }
    case "logic-app-storage": {
      const workflowName = typeof formValues.workflowName === "string" ? formValues.workflowName : "sandbox-workflow";
      const foundry = requireFoundryConfig(foundryApiKey, foundryResourceName);
      return [
        buildLogicApp(workflowName, location, formValues, "http"),
        buildStorageAccount(
          typeof formValues.storageAccountName === "string" ? formValues.storageAccountName : "sandboxstorage",
          location,
          formValues,
          suffix
        ),
        buildAzureOpenAiConnection(workflowName, location, foundry.resourceName, foundry.apiKey, deployParams),
      ];
    }
```

- [ ] **Step 5: Update `buildArmTemplate`'s signature and call site**

In `functions/src/modules/deployments/arm-template-builder.ts`, change the `buildArmTemplate` function (currently at line 721):

```typescript
export function buildArmTemplate(
  payload: DeploymentPayload,
  opts: { tenantId: string; tags?: Record<string, string>; submissionId?: string }
): ArmTemplate {
```

to:

```typescript
export function buildArmTemplate(
  payload: DeploymentPayload,
  opts: {
    tenantId: string;
    tags?: Record<string, string>;
    submissionId?: string;
    foundryApiKey?: string;
    foundryResourceName?: string;
  }
): ArmTemplate {
```

And change the `primaryResources` assignment (currently lines 728-731):

```typescript
  const primaryResources =
    payload.mode === "template"
      ? buildTemplateResources(payload.template, uniqueSuffix)
      : buildCustomResources(payload.resources, opts.tenantId, uniqueSuffix, deployParams);
```

to:

```typescript
  const primaryResources =
    payload.mode === "template"
      ? buildTemplateResources(payload.template, uniqueSuffix, deployParams, opts.foundryApiKey, opts.foundryResourceName)
      : buildCustomResources(payload.resources, opts.tenantId, uniqueSuffix, deployParams);
```

(`deployParams` is already declared above this in the function body — no new variable needed.)

- [ ] **Step 6: Run tests to verify they pass**

Run (from `functions/`): `npx vitest run src/__tests__/modules/deployments/arm-template-builder.test.ts`
Expected: all tests PASS.

- [ ] **Step 7: Type-check**

Run (from `functions/`): `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 8: Commit**

```bash
git add functions/src/modules/deployments/arm-template-builder.ts functions/src/__tests__/modules/deployments/arm-template-builder.test.ts
git commit -m "feat: auto-provision Azure OpenAI connection for logic-app templates"
```

---

### Task 4: Thread Foundry env vars through `bicep-executor.ts`

**Files:**
- Modify: `functions/src/modules/deployments/bicep-executor.ts:64-68`
- Modify: `functions/src/__tests__/modules/deployments/bicep-executor.test.ts`

**Interfaces:**
- Consumes: `env.FOUNDRY_API_KEY`, `env.FOUNDRY_RESOURCE_NAME` (Task 1), `buildArmTemplate(payload, opts)` with `opts.foundryApiKey`/`opts.foundryResourceName` (Task 3).
- Produces: nothing new consumed by later tasks — this is the last functions-side task.

- [ ] **Step 1: Write the failing test**

In `functions/src/__tests__/modules/deployments/bicep-executor.test.ts`, add these two lines to the `process.env` stub block at the top of the file (after the existing `AZURE_STORAGE_CONNECTION_STRING` line):

```typescript
process.env.FOUNDRY_API_KEY ??= "test-foundry-key";
process.env.FOUNDRY_RESOURCE_NAME ??= "test-foundry-resource";
```

Add this new test at the end of the `describe("executeBicepDeployment", ...)` block, after the `"throws PolicyBlockedTemplateError..."` test:

```typescript
  it("includes the Azure OpenAI connection and its secure parameter for logic-app payloads", async () => {
    let putBody: unknown;
    const fetchFn = vi
      .fn()
      .mockImplementationOnce(async (_url: string, init: RequestInit) => {
        putBody = JSON.parse(init.body as string);
        return { ok: false, status: 400, text: async () => "stop" };
      });
    vi.stubGlobal("fetch", fetchFn);
    createOrUpdate.mockResolvedValue({});

    await expect(
      executeBicepDeployment({
        subscriptionId: "sub-1",
        resourceGroupName: "rg-1",
        deploymentName: "dep-ai",
        payload: {
          mode: "template",
          tags: TAGS,
          template: { slug: "logic-app", formValues: { workflowName: "ai-workflow" } },
        },
        location: "malaysiawest",
        tags: TAGS,
        deployedBy: "user@test.com",
      })
    ).rejects.toThrow();

    const sent = putBody as {
      properties: {
        template: { resources: Array<{ type: string }> };
        parameters: Record<string, { value: string }>;
      };
    };
    const types = sent.properties.template.resources.map((r) => r.type);
    expect(types).toContain("Microsoft.Web/connections");
    expect(sent.properties.parameters.azureopenaiApiKey).toEqual({ value: process.env.FOUNDRY_API_KEY });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `functions/`): `npx vitest run src/__tests__/modules/deployments/bicep-executor.test.ts -t "includes the Azure OpenAI connection"`
Expected: FAIL — `types` doesn't contain `"Microsoft.Web/connections"` (bicep-executor.ts doesn't pass `foundryApiKey`/`foundryResourceName` to `buildArmTemplate` yet, so `buildTemplateResources` throws `InvalidDeploymentConfigError` inside `executeBicepDeployment`, which the test's `.rejects.toThrow()` swallows — but `putBody` never gets set because the throw happens before the `fetch` call, so `sent` is `undefined` and the test errors trying to read `.properties`).

- [ ] **Step 3: Pass the env vars through**

In `functions/src/modules/deployments/bicep-executor.ts`, change the `buildArmTemplate` call (currently lines 64-68):

```typescript
  const template = buildArmTemplate(opts.payload, {
    tenantId: env.AZURE_TENANT_ID,
    tags: policyTags,
    submissionId: id,
  });
```

to:

```typescript
  const template = buildArmTemplate(opts.payload, {
    tenantId: env.AZURE_TENANT_ID,
    tags: policyTags,
    submissionId: id,
    foundryApiKey: env.FOUNDRY_API_KEY,
    foundryResourceName: env.FOUNDRY_RESOURCE_NAME,
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run (from `functions/`): `npx vitest run src/__tests__/modules/deployments/bicep-executor.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Full functions/ gate**

Run (from `functions/`):
```bash
npx tsc --noEmit
npx vitest run
```
Expected: 0 type errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add functions/src/modules/deployments/bicep-executor.ts functions/src/__tests__/modules/deployments/bicep-executor.test.ts
git commit -m "feat: pass Foundry credentials from env into ARM template builder"
```

---

### Task 5: Update Function App deployment config and displayed resource counts

**Files:**
- Modify: `web/data/templates.json:9` and `web/data/templates.json:35`
- Modify: `.claude/rules/azure-infra.md` (add the 2 new Function App settings to Step 5's table)
- Modify: `CLAUDE.md` (session summary + Template Catalog table)

**Interfaces:** none — this task only touches data/docs, no code.

- [ ] **Step 1: Bump `resourceCount` in `templates.json`**

In `web/data/templates.json`, change line 9 (`logic-app` entry) from:

```json
    "resourceCount": 1,
```

to:

```json
    "resourceCount": 2,
```

And change line 35 (`logic-app-storage` entry) from:

```json
    "resourceCount": 2,
```

to:

```json
    "resourceCount": 3,
```

- [ ] **Step 2: Verify the existing web test suite still passes**

Search for any test asserting the old `resourceCount` values:

Run (from `web/`): `npx vitest run -t "resourceCount"`

If any test hardcodes `resourceCount: 1` or `resourceCount: 2` for these two slugs, update it to `2`/`3` to match. If no such test exists, this step is a no-op verification.

- [ ] **Step 3: Add the 2 new Function App settings to the admin doc**

In `.claude/rules/azure-infra.md`, add two rows to the Step 5 table (Function App Application Settings), after the `AzureWebJobsStorage` row:

```markdown
| `FOUNDRY_API_KEY` | Azure AI Foundry / Azure OpenAI API key (shared resource used by every logic-app / logic-app-storage deployment) |
| `FOUNDRY_RESOURCE_NAME` | Azure OpenAI resource name (the subdomain segment of the endpoint, e.g. `coe-ai-foundry-eus2` from `https://coe-ai-foundry-eus2.openai.azure.com`) |
```

- [ ] **Step 4: Update CLAUDE.md**

In `CLAUDE.md`, update the "What is live and working" sentence in the Session Context section to mention the new behavior (append to the existing sentence rather than rewriting it), and update the Template Catalog table's resource type / count if it lists counts (check current content — as of this plan's writing it lists slug/resourceType/count columns; add the connection to the `logic-app` and `logic-app-storage` resource-type descriptions, e.g. `Logic App` → `Logic App + Azure OpenAI connection`, `Logic App + Storage Account` → `Logic App + Storage Account + Azure OpenAI connection`).

- [ ] **Step 5: Full web/ gate**

Run (from `web/`):
```bash
npx vitest run
npx tsc --noEmit
npm run build
```
Expected: all pass, 0 errors, `.next/` produced.

- [ ] **Step 6: Commit**

```bash
git add web/data/templates.json .claude/rules/azure-infra.md CLAUDE.md
git commit -m "docs: reflect auto-wired Foundry connection in templates and admin docs"
```

---

## Post-Implementation (manual, not part of this plan's automated steps)

These are **admin actions**, not code changes — flag them to the user, do not perform them autonomously:

1. Set `FOUNDRY_API_KEY` and `FOUNDRY_RESOURCE_NAME` in the live `epf-sandbox-functions` Function App's Application Settings (Portal → Configuration), then restart.
2. Verify subscription policy `COE-Allowed-Resources` permits `Microsoft.Web/connections` — submit one real `logic-app` deployment and confirm the connection resource is created, not policy-denied.
3. Verify the `azureopenai` managed connector is available in `malaysiawest` — same real-deployment test covers this.
4. After a successful real deployment, open the deployed Logic App's "API connections" blade and confirm the Azure OpenAI connection appears and is usable in the Designer (this is the actual acceptance criterion from the original ask).
