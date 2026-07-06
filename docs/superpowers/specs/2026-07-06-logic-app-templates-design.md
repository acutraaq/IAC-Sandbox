# Design: Logic App templates + region lock simplification

**Date:** 2026-07-06
**Status:** Draft — pending user review

## Purpose

Add two new deployable templates (`logic-app`, `logic-app-storage`) and simplify the
region policy platform-wide: Southeast Asia is retired as a region choice, leaving
Malaysia West as the only deployable region.

## Background

3 templates currently exist: `approval-workflow` and `scheduled-automation` (both
deploy a Consumption-tier `Microsoft.Logic/workflows`, scoped to specific business
scenarios with a preset trigger), and `static-web-app`. The ARM builder
(`functions/src/modules/deployments/arm-template-builder.ts`) already implements
`buildLogicApp()` and `buildStorageAccount()` — both are reused, not newly written.

Every existing template also exposes a `region` select field (Malaysia West /
Southeast Asia). This design retires that choice — Malaysia West becomes the sole
region, hardcoded, with no wizard field.

## Architecture — no new subsystems

This is data + two switch-case additions, not new infrastructure. It follows the
existing template-mode dispatch path: `templates.json` → wizard → `POST /api/deployments`
→ queue → `processDeployment` → `buildArmTemplate` → `buildTemplateResources(slug, formValues)`.

## Components

### 1. Region lock (`ALLOWED_REGIONS` → single value)

- `web/lib/deployments/rg-name.ts`: `ALLOWED_REGIONS` shrinks from
  `{"malaysiawest", "southeastasia"}` to `{"malaysiawest"}`. `DEFAULT_REGION` stays
  `"malaysiawest"`. Kept as a `Set` (not deleted/inlined) — `deriveLocation()` still
  clamps any stray `region` value from a direct API caller down to `malaysiawest`,
  same defense-in-depth the code already does for out-of-range values.
- `functions/src/modules/deployments/arm-template-builder.ts`: same shrink to
  `ALLOWED_REGIONS` used by `resolveRegion()`. This function is also called from
  `buildCustomResources()` (the kept "custom mode" API path), so clamping stays live
  there too.
- `web/data/templates.json`: remove the `region` field from the first step of all
  5 templates (3 existing + 2 new). No template step asks the user to choose a
  region anymore.
- Docs: `CLAUDE.md` and `.claude/rules/templates.md` region-lock bullet lists
  collapse to a single "Malaysia West only" line.

### 2. New template: `logic-app`

- `web/data/templates.json` entry: name "Logic App", category `automation`, icon
  `Zap`, `resourceCount: 1`, `estimatedTime: "~1 minute"`.
- One step, "Workflow Details": `workflowName` (text, required) only.
- `web/lib/deployments/policy.ts`: add `"logic-app"` to `DEPLOYABLE_SLUGS`.
- `web/lib/deployments/rg-name.ts`: `SLUG_PRIMARY_FIELD["logic-app"] = "workflowName"`.
- `arm-template-builder.ts` `buildTemplateResources` switch: new case
  `"logic-app"` → `[buildLogicApp(formValues.workflowName ?? "sandbox-workflow", location, formValues, "http")]`.
  Reuses the exact builder function `approval-workflow` already calls — same HTTP
  trigger, same empty `actions`/`outputs` shape.

### 3. New template: `logic-app-storage`

- `web/data/templates.json` entry: name "Logic App + Storage", category
  `automation`, icon `HardDrive`, `resourceCount: 2`, `estimatedTime: "~1 minute"`.
- Two steps: "Workflow Details" (`workflowName`, text, required) and "Storage
  Details" (`storageAccountName`, text, required).
- `policy.ts`: add `"logic-app-storage"` to `DEPLOYABLE_SLUGS`.
- `rg-name.ts`: `SLUG_PRIMARY_FIELD["logic-app-storage"] = "workflowName"` (Logic
  App is the primary resource for RG-name derivation purposes; storage is
  secondary).
- `arm-template-builder.ts` switch: new case `"logic-app-storage"` → returns
  `[buildLogicApp(workflowName, location, formValues, "http"), buildStorageAccount(storageAccountName, location, formValues)]`.
  Storage gets no extra config (redundancy/accessTier/publicAccess) — `buildStorageAccount`
  already defaults these to `LRS` / `Hot` / private when the config object doesn't
  set them, matching the "name only" field-minimalism of every other template.

## Data flow (unchanged shape, fewer inputs)

Wizard submit → `{ mode: "template", tags, template: { slug, formValues } }` →
`policy.ts` allow-list check → `rg-name.ts` derives RG name (from `workflowName`)
and location (now always `malaysiawest`) → queued → `processDeployment` → ARM
template built → resource group + resources deployed with the 4 policy tags.

No schema change: `formValues` is already `z.record(z.string(), z.unknown())` in
both `web/lib/deployments/schema.ts` and the functions-side mirror — it doesn't
enumerate field names, so removing/adding fields in `templates.json` needs no Zod
schema edit.

## Error handling

No new error paths. `buildTemplateResources`'s existing `default:` case (unknown
slug throws "has no ARM builder") still applies to any slug not covered by the
switch — the 2 new slugs simply add covered cases. Policy-block behavior (403 for
non-allow-listed slugs) is unchanged, just extended to allow 2 more slugs.

## Testing

- `web/__tests__/lib/deployments/policy.test.ts`: add "allows logic-app" and
  "allows logic-app-storage" cases.
- `web/__tests__/lib/deployments/rg-name.test.ts`: update the `southeastasia`
  formValues cases — they now clamp to `malaysiawest` instead of passing through,
  since `ALLOWED_REGIONS` no longer contains it.
- `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`: add
  cases for both new slugs — `logic-app` builds 1 resource
  (`Microsoft.Logic/workflows`), `logic-app-storage` builds 2
  (`Microsoft.Logic/workflows` + `Microsoft.Storage/storageAccounts`).
- Full gate re-run after: `npx vitest run` + `npx tsc --noEmit` + `npm run lint` in
  both `web/` and `functions/`, plus `npm run build` in `web/`.

## Out of scope

- No change to `approval-workflow`/`scheduled-automation`'s existing trigger logic
  or their second step (Approval Settings / Schedule) — only their `region` field
  is removed.
- No change to the functions-side "custom mode" ARM builder capability (kept as
  decided in the prior CLAUDE.md audit session) beyond the shared `ALLOWED_REGIONS`
  shrink, which it already consumes via `resolveRegion()`.
- No new icons, no new categories.
