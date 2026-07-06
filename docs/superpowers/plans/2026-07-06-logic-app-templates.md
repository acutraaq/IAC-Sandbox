# Logic App Templates + Region Lock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 2 new deployable templates (`logic-app`, `logic-app-storage`) and retire Southeast Asia as a region choice platform-wide, leaving Malaysia West as the only deployable region.

**Architecture:** No new subsystems. Reuses the existing template-mode dispatch path (`templates.json` → wizard → `POST /api/deployments` → queue → `processDeployment` → `buildArmTemplate` → `buildTemplateResources(slug, formValues)`) and 2 already-implemented ARM builder functions (`buildLogicApp`, `buildStorageAccount`). Region lock is a 1-item `Set` shrink in 2 files plus a field removal in template data.

**Tech Stack:** Next.js 16 (web), Azure Functions v4 (functions), Zod, Vitest.

Spec: `docs/superpowers/specs/2026-07-06-logic-app-templates-design.md`

---

### Task 1: Region lock — `web/lib/deployments/rg-name.ts`

**Files:**
- Modify: `web/lib/deployments/rg-name.ts:3` (`ALLOWED_REGIONS`), `:10-14` (`SLUG_PRIMARY_FIELD`)
- Test: `web/__tests__/lib/deployments/rg-name.test.ts:104-152` (`deriveLocation` describe block)

- [ ] **Step 1: Update the failing tests first**

In `web/__tests__/lib/deployments/rg-name.test.ts`, replace the `deriveLocation` describe block (lines 104-153) with:

```typescript
describe("deriveLocation", () => {
  it("returns malaysiawest regardless of template formValues region", () => {
    const result = deriveLocation({
      mode: "template",
      tags: validTags,
      template: { slug: "approval-workflow", formValues: { region: "southeastasia" } },
    });
    expect(result).toBe("malaysiawest");
  });

  it("defaults to malaysiawest for template mode with no region", () => {
    const result = deriveLocation({
      mode: "template",
      tags: validTags,
      template: { slug: "approval-workflow", formValues: {} },
    });
    expect(result).toBe("malaysiawest");
  });

  it("returns malaysiawest regardless of custom mode resource config region", () => {
    const result = deriveLocation({
      mode: "custom",
      tags: validTags,
      resources: [
        { type: "Microsoft.Web/staticSites", name: "store", icon: "Database", config: { region: "southeastasia" } },
      ],
    });
    expect(result).toBe("malaysiawest");
  });

  it("defaults to malaysiawest for custom mode with no region", () => {
    const result = deriveLocation({
      mode: "custom",
      tags: validTags,
      resources: [
        { type: "Microsoft.Web/staticSites", name: "store", icon: "Database", config: {} },
      ],
    });
    expect(result).toBe("malaysiawest");
  });

  it("clamps disallowed region to malaysiawest", () => {
    const result = deriveLocation({
      mode: "template",
      tags: validTags,
      template: { slug: "approval-workflow", formValues: { region: "eastus" } },
    });
    expect(result).toBe("malaysiawest");
  });
});
```

- [ ] **Step 2: Run the tests, confirm the first and third cases fail**

Run (from `web/`): `npx vitest run __tests__/lib/deployments/rg-name.test.ts`
Expected: FAIL — "returns malaysiawest regardless of template formValues region" and "returns malaysiawest regardless of custom mode resource config region" both currently return `"southeastasia"` (still in `ALLOWED_REGIONS`), not `"malaysiawest"`.

- [ ] **Step 3: Shrink `ALLOWED_REGIONS` and add new `SLUG_PRIMARY_FIELD` entries**

In `web/lib/deployments/rg-name.ts`, change line 3:

```typescript
export const ALLOWED_REGIONS = new Set(["malaysiawest"]);
```

And change the `SLUG_PRIMARY_FIELD` block (lines 10-14) to:

```typescript
export const SLUG_PRIMARY_FIELD: Record<string, string> = {
  "approval-workflow":  "workflowName",
  "scheduled-automation": "workflowName",
  "static-web-app":       "appName",
  "logic-app":            "workflowName",
  "logic-app-storage":    "workflowName",
};
```

- [ ] **Step 4: Run the tests, confirm they pass**

Run (from `web/`): `npx vitest run __tests__/lib/deployments/rg-name.test.ts`
Expected: PASS (all cases)

- [ ] **Step 5: Commit**

```bash
git add web/lib/deployments/rg-name.ts web/__tests__/lib/deployments/rg-name.test.ts
git commit -m "feat: lock region to malaysiawest only, add SLUG_PRIMARY_FIELD entries for logic-app templates"
```

---

### Task 2: Region lock — `functions/src/modules/deployments/arm-template-builder.ts`

**Files:**
- Modify: `functions/src/modules/deployments/arm-template-builder.ts:5` (`ALLOWED_REGIONS`)
- Modify: `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts:103` (drop stale `region: "southeastasia"`)

- [ ] **Step 1: Shrink `ALLOWED_REGIONS`**

In `functions/src/modules/deployments/arm-template-builder.ts`, change line 5:

```typescript
const ALLOWED_REGIONS = new Set(["malaysiawest"]);
```

- [ ] **Step 2: Remove the now-meaningless `region: "southeastasia"` test input**

In `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`, change line 102-105 from:

```typescript
    const t = buildArmTemplate(
      templatePayload("approval-workflow", { workflowName: "leave-approval", region: "southeastasia" }),
      { tenantId: TENANT_ID }
    );
```

to:

```typescript
    const t = buildArmTemplate(
      templatePayload("approval-workflow", { workflowName: "leave-approval" }),
      { tenantId: TENANT_ID }
    );
```

- [ ] **Step 3: Run the functions test suite, confirm all pass**

Run (from `functions/`): `npx vitest run`
Expected: PASS — 74 tests (no count change, this task only edits existing test input/constant)

- [ ] **Step 4: Commit**

```bash
git add functions/src/modules/deployments/arm-template-builder.ts functions/src/__tests__/modules/deployments/arm-template-builder.test.ts
git commit -m "feat(functions): lock region to malaysiawest only"
```

---

### Task 3: Remove `region` field from the 3 existing templates + fix stale doc references

**Files:**
- Modify: `web/data/templates.json` (remove `region` field object from the first step's `fields` array in all 3 entries)
- Modify: `CLAUDE.md:208` (stale `resources.json` dir-tree line — file was deleted in a prior session)

- [ ] **Step 1: Remove the `region` field from `approval-workflow`**

In `web/data/templates.json`, the `approval-workflow` entry's first step currently has a `fields` array with `workflowName` then `region`. Remove the `region` field object (keep the trailing comma structure valid — `workflowName` becomes the only element):

```json
        "fields": [
          {
            "name": "workflowName",
            "label": "What should we call this workflow?",
            "type": "text",
            "required": true,
            "placeholder": "leave-approval-workflow",
            "helpText": "Use a name that describes what this workflow approves, e.g. 'expense-claims' or 'document-review'."
          }
        ]
```

- [ ] **Step 2: Remove the `region` field from `scheduled-automation`**

Same pattern — its first step's `fields` array becomes:

```json
        "fields": [
          {
            "name": "workflowName",
            "label": "What should we call this scheduled task?",
            "type": "text",
            "required": true,
            "placeholder": "weekly-report-runner",
            "helpText": "Use a name that describes what this task does, e.g. 'monthly-member-report' or 'nightly-data-sync'."
          }
        ]
```

- [ ] **Step 3: Remove the `region` field from `static-web-app`**

Its first step's `fields` array becomes:

```json
        "fields": [
          {
            "name": "appName",
            "label": "What should we call this application?",
            "type": "text",
            "required": true,
            "placeholder": "my-static-app",
            "helpText": "This will be part of your application's web address."
          }
        ]
```

- [ ] **Step 4: Validate the JSON parses and templates page still renders**

Run (from `web/`): `node -e "const d=require('./data/templates.json'); console.log(d.length, d.map(t=>t.steps[0].fields.length))"`
Expected output: `3 [ 1, 1, 1 ]` (3 templates, each first step now has exactly 1 field)

- [ ] **Step 5: Fix stale `resources.json` dir-tree reference in CLAUDE.md**

In `CLAUDE.md`, the directory tree has this line (around line 208, under `web/data/`):

```
│   │   └── resources.json       # 10 resource types for Custom Builder flow
```

Delete this line entirely — `resources.json` was already deleted in a prior session's dead-code cleanup, and the Custom Builder flow it backed no longer exists. The line above it (`templates.json`) should be the last entry under `web/data/`, so remove the trailing description text that referenced regions if present and leave just:

```
│   │   └── templates.json       # 3 templates across 2 categories; region locked to malaysiawest only
```

- [ ] **Step 6: Run the full web test suite**

Run (from `web/`): `npx vitest run`
Expected: PASS — 236 tests (no test references the deleted `region` field directly; `ReviewSection`/wizard render from `steps[].fields` dynamically)

- [ ] **Step 7: Commit**

```bash
git add web/data/templates.json CLAUDE.md
git commit -m "feat: remove region field from existing templates, fix stale resources.json doc reference"
```

---

### Task 4: Add `logic-app` template

**Files:**
- Modify: `web/data/templates.json` (new entry)
- Modify: `web/lib/deployments/policy.ts:39-43` (`DEPLOYABLE_SLUGS`)
- Modify: `functions/src/modules/deployments/arm-template-builder.ts:542-574` (`buildTemplateResources` switch)
- Test: `web/__tests__/lib/deployments/policy.test.ts`
- Test: `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`

- [ ] **Step 1: Write the failing policy test**

In `web/__tests__/lib/deployments/policy.test.ts`, add inside the `describe("template mode", ...)` block (after the `"allows static-web-app"` case):

```typescript
    it("allows logic-app", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "logic-app", formValues: {} },
      });
      expect(result).toBeNull();
    });
```

- [ ] **Step 2: Write the failing ARM builder test**

In `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`, add a new describe block after `buildStaticWebApp (static-web-app template)` (after line 186):

```typescript
// ---------------------------------------------------------------------------
// Logic App (bare, no preset trigger scenario)
// ---------------------------------------------------------------------------

describe("buildLogicAppTemplate (logic-app template)", () => {
  it("returns 1 resource: Logic App with HTTP trigger", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "my-workflow" }),
      { tenantId: TENANT_ID }
    );
    expect(t.resources).toHaveLength(1);
    expect(t.resources[0].type).toBe("Microsoft.Logic/workflows");
    const def = (t.resources[0] as Record<string, unknown>).properties as { definition: { triggers: Record<string, unknown> } };
    expect(def.definition.triggers).toHaveProperty("manual");
  });

  it("sanitizes workflow name", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app", { workflowName: "My Workflow!!" }),
      { tenantId: TENANT_ID }
    );
    expect(t.resources[0].name).toMatch(/^[a-z0-9-]+$/);
  });
});
```

- [ ] **Step 3: Run both test suites, confirm failures**

Run (from `web/`): `npx vitest run __tests__/lib/deployments/policy.test.ts`
Expected: FAIL — `"logic-app"` not in `DEPLOYABLE_SLUGS`, `result` is `{ blocked: ["logic-app"] }` not `null`.

Run (from `functions/`): `npx vitest run`
Expected: FAIL — `buildTemplateResources` throws `'Template slug "logic-app" has no ARM builder.'`

- [ ] **Step 4: Add `logic-app` to `DEPLOYABLE_SLUGS`**

In `web/lib/deployments/policy.ts`, change lines 39-43:

```typescript
const DEPLOYABLE_SLUGS = new Set([
  "approval-workflow",
  "scheduled-automation",
  "static-web-app",
  "logic-app",
  "logic-app-storage",
]);
```

(Adding both new slugs here now avoids a second edit to this same set in Task 5.)

- [ ] **Step 5: Add the `logic-app` case to `buildTemplateResources`**

In `functions/src/modules/deployments/arm-template-builder.ts`, in the `switch (slug)` block inside `buildTemplateResources` (before the `default:` case), add:

```typescript
    case "logic-app":
      return [
        buildLogicApp(
          typeof formValues.workflowName === "string" ? formValues.workflowName : "sandbox-workflow",
          location,
          formValues,
          "http"
        ),
      ];
```

- [ ] **Step 6: Add the `logic-app` template entry to `templates.json`**

In `web/data/templates.json`, add a new entry to the array (after `static-web-app`, as the 4th entry):

```json
  {
    "slug": "logic-app",
    "name": "Logic App",
    "description": "Deploy a blank Logic App with an HTTP trigger — start from an empty canvas and build your own workflow logic in the Azure Portal designer.",
    "category": "automation",
    "icon": "Zap",
    "resourceCount": 1,
    "estimatedTime": "~1 minute",
    "steps": [
      {
        "title": "Workflow Details",
        "description": "Give your Logic App a name.",
        "fields": [
          {
            "name": "workflowName",
            "label": "What should we call this Logic App?",
            "type": "text",
            "required": true,
            "placeholder": "my-logic-app",
            "helpText": "Use a name that describes what this workflow will do — you can build the logic itself in the Azure Portal after deployment."
          }
        ]
      }
    ]
  }
```

- [ ] **Step 7: Run both test suites, confirm they pass**

Run (from `web/`): `npx vitest run __tests__/lib/deployments/policy.test.ts`
Expected: PASS

Run (from `functions/`): `npx vitest run`
Expected: PASS — 76 tests (74 + 2 new)

- [ ] **Step 8: Commit**

```bash
git add web/data/templates.json web/lib/deployments/policy.ts web/__tests__/lib/deployments/policy.test.ts functions/src/modules/deployments/arm-template-builder.ts functions/src/__tests__/modules/deployments/arm-template-builder.test.ts
git commit -m "feat: add logic-app template"
```

---

### Task 5: Add `logic-app-storage` template

**Files:**
- Modify: `web/data/templates.json` (new entry)
- Modify: `functions/src/modules/deployments/arm-template-builder.ts` (`buildTemplateResources` switch)
- Test: `web/__tests__/lib/deployments/policy.test.ts`
- Test: `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`

(`DEPLOYABLE_SLUGS` and `SLUG_PRIMARY_FIELD` already cover `logic-app-storage` from Tasks 1 and 4 — no further edits needed there.)

- [ ] **Step 1: Write the failing policy test**

In `web/__tests__/lib/deployments/policy.test.ts`, add after the `"allows logic-app"` case from Task 4:

```typescript
    it("allows logic-app-storage", () => {
      const result = validateDeploymentPolicy({
        mode: "template",
        tags: validTags,
        template: { slug: "logic-app-storage", formValues: {} },
      });
      expect(result).toBeNull();
    });
```

- [ ] **Step 2: Write the failing ARM builder test**

In `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`, add after the `buildLogicAppTemplate` describe block from Task 4:

```typescript
// ---------------------------------------------------------------------------
// Logic App + Storage
// ---------------------------------------------------------------------------

describe("buildLogicAppStorageTemplate (logic-app-storage template)", () => {
  it("returns 2 resources: Logic App and Storage Account", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "my-workflow", storageAccountName: "mystorage" }),
      { tenantId: TENANT_ID }
    );
    expect(t.resources).toHaveLength(2);
    const types = t.resources.map((r) => r.type);
    expect(types).toContain("Microsoft.Logic/workflows");
    expect(types).toContain("Microsoft.Storage/storageAccounts");
  });

  it("sanitizes both resource names independently", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "My Workflow!!", storageAccountName: "My Storage!!" }),
      { tenantId: TENANT_ID }
    );
    for (const r of t.resources) {
      expect(r.name).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("defaults storage account to LRS/Hot/private when no extra config given", () => {
    const t = buildArmTemplate(
      templatePayload("logic-app-storage", { workflowName: "wf", storageAccountName: "store" }),
      { tenantId: TENANT_ID }
    );
    const storage = t.resources.find((r) => r.type === "Microsoft.Storage/storageAccounts") as Record<string, unknown>;
    expect((storage.sku as { name: string }).name).toBe("Standard_LRS");
    const props = storage.properties as { accessTier: string; allowBlobPublicAccess: boolean };
    expect(props.accessTier).toBe("Hot");
    expect(props.allowBlobPublicAccess).toBe(false);
  });
});
```

- [ ] **Step 3: Run both test suites, confirm failures**

Run (from `web/`): `npx vitest run __tests__/lib/deployments/policy.test.ts`
Expected: PASS already (Task 4 added both slugs to `DEPLOYABLE_SLUGS` together) — this confirms Step 1 test passes immediately; no fix needed here.

Run (from `functions/`): `npx vitest run`
Expected: FAIL — `buildTemplateResources` throws `'Template slug "logic-app-storage" has no ARM builder.'`

- [ ] **Step 4: Add the `logic-app-storage` case to `buildTemplateResources`**

In `functions/src/modules/deployments/arm-template-builder.ts`, in the same `switch (slug)` block, add after the `logic-app` case from Task 4:

```typescript
    case "logic-app-storage":
      return [
        buildLogicApp(
          typeof formValues.workflowName === "string" ? formValues.workflowName : "sandbox-workflow",
          location,
          formValues,
          "http"
        ),
        buildStorageAccount(
          typeof formValues.storageAccountName === "string" ? formValues.storageAccountName : "sandboxstorage",
          location,
          formValues
        ),
      ];
```

- [ ] **Step 5: Add the `logic-app-storage` template entry to `templates.json`**

In `web/data/templates.json`, add a new entry (after `logic-app`, as the 5th entry):

```json
  {
    "slug": "logic-app-storage",
    "name": "Logic App + Storage",
    "description": "Deploy a Logic App together with a Storage Account — for workflows that need to read or write blob data.",
    "category": "automation",
    "icon": "HardDrive",
    "resourceCount": 2,
    "estimatedTime": "~1 minute",
    "steps": [
      {
        "title": "Workflow Details",
        "description": "Give your Logic App a name.",
        "fields": [
          {
            "name": "workflowName",
            "label": "What should we call this Logic App?",
            "type": "text",
            "required": true,
            "placeholder": "my-logic-app",
            "helpText": "Use a name that describes what this workflow will do — you can build the logic itself in the Azure Portal after deployment."
          }
        ]
      },
      {
        "title": "Storage Details",
        "description": "Give the paired Storage Account a name.",
        "fields": [
          {
            "name": "storageAccountName",
            "label": "What should we call the storage account?",
            "type": "text",
            "required": true,
            "placeholder": "mylogicappstorage",
            "helpText": "Lowercase letters and numbers only, no spaces or symbols."
          }
        ]
      }
    ]
  }
```

- [ ] **Step 6: Run both test suites, confirm they pass**

Run (from `web/`): `npx vitest run __tests__/lib/deployments/policy.test.ts`
Expected: PASS

Run (from `functions/`): `npx vitest run`
Expected: PASS — 79 tests (76 + 3 new)

- [ ] **Step 7: Commit**

```bash
git add web/data/templates.json functions/src/modules/deployments/arm-template-builder.ts web/__tests__/lib/deployments/policy.test.ts functions/src/__tests__/modules/deployments/arm-template-builder.test.ts
git commit -m "feat: add logic-app-storage template"
```

---

### Task 6: Update catalog docs

**Files:**
- Modify: `CLAUDE.md:111-124` (Template Catalog section)
- Modify: `.claude/rules/templates.md:6-21` (Template Catalog section)

- [ ] **Step 1: Update `CLAUDE.md`'s Template Catalog section**

Replace lines 111-124 (from `## Template Catalog` through the `Deployable slugs` bullet) with:

```markdown
## Template Catalog

5 templates across 2 categories (automation, compute). Region is locked to Malaysia West only — no region choice in any wizard.

| Category | Slug | Resource Type | Count |
|----------|------|---------------|-------|
| automation | `approval-workflow` | Logic App | 1 |
| automation | `scheduled-automation` | Logic App | 1 |
| automation | `logic-app` | Logic App | 1 |
| automation | `logic-app-storage` | Logic App + Storage Account | 2 |
| compute | `static-web-app` | Static Web App | 1 |

Deployable slugs (allow-list in `web/lib/deployments/policy.ts`):
- `approval-workflow`, `scheduled-automation`, `static-web-app`, `logic-app`, `logic-app-storage`
```

- [ ] **Step 2: Update `.claude/rules/templates.md`'s Template Catalog section**

Replace lines 6-21 (from `# Template Catalog` through `Policy-blocked slugs: none...`) with:

```markdown
# Template Catalog

5 templates across 2 categories — live in `web/data/templates.json`. Region is locked to Malaysia West only — no region field in any wizard.

| Category | Slug | Resource Type |
|----------|------|---------------|
| automation | `approval-workflow` | `Microsoft.Logic/workflows` (HTTP trigger) |
| automation | `scheduled-automation` | `Microsoft.Logic/workflows` (recurrence trigger) |
| automation | `logic-app` | `Microsoft.Logic/workflows` (HTTP trigger, blank) |
| automation | `logic-app-storage` | `Microsoft.Logic/workflows` (HTTP trigger) + `Microsoft.Storage/storageAccounts` |
| compute | `static-web-app` | `Microsoft.Web/staticSites` |

Deployable slugs (allow-list in `web/lib/deployments/policy.ts` — **must exactly match what is in `templates.json`**):
- `approval-workflow`, `scheduled-automation`, `static-web-app`, `logic-app`, `logic-app-storage`

Policy-blocked slugs: none (all 5 active slugs are deployable).
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md .claude/rules/templates.md
git commit -m "docs: update template catalog for logic-app templates and region lock"
```

---

### Task 7: Full verification gate

**Files:** none (verification only)

- [ ] **Step 1: Run the web gate**

Run (from `web/`):
```bash
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
```
Expected: lint 0 errors, tsc 0 errors, vitest all pass (238 tests: 236 + 2 new policy cases — `rg-name.test.ts` cases were modified in place, not added), build succeeds.

- [ ] **Step 2: Run the functions gate**

Run (from `functions/`):
```bash
npx tsc --noEmit
npx vitest run
```
Expected: tsc 0 errors, vitest all pass (79 tests per Task 5 Step 6).

- [ ] **Step 3: Manually smoke-test in the browser**

Start dev server (from `web/`): `$env:NODE_OPTIONS="--use-system-ca"; npm run dev`
Navigate to `/templates` — confirm 5 templates render, 2 new ones show under "automation" category with correct icons (`Zap`, `HardDrive`), no region step appears in any template's wizard. Click through `logic-app` and `logic-app-storage` to `/review` and confirm the review summary shows only the fields actually collected (no region row).

- [ ] **Step 4: Fix the CI schema-drift check reference if needed**

No action expected — Task 1-5 changes don't touch `deploymentPayloadSchema`/`tagsSchema` shape (`formValues` stays `z.record(...)`), so the CI schema-drift check (fixed in a prior session, `.github/workflows/ci.yml` Schema drift check step) should remain unaffected. Confirm by re-running the check locally:

```bash
cd web && diff -u <(sed '/^\/\//d' ../functions/src/modules/deployments/deployment.schema.ts | sed -n '1,/^export type DeploymentPayload/p' | sed 's/\.default({})//g' | sed 's/\.min(1)/.min(1)/g' | sed 's/, "[^"]*"//g') <(sed '/^\/\//d' lib/deployments/schema.ts | sed 's/\.default({})//g' | sed 's/\.min(1)/.min(1)/g' | sed 's/, "[^"]*"//g') && echo "MATCH — no drift"
```
Expected: `MATCH — no drift`
