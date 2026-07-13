# Design: Auto-wired Azure OpenAI (Foundry) connection on Logic App templates

**Date:** 2026-07-13
**Status:** Draft — pending user review

## Purpose

Today, deploying `logic-app` or `logic-app-storage` produces an empty Logic App
with no API connections (see the "API connections" blade screenshot that
prompted this design — "No connections"). Any user who wants the workflow to
call an AI model has to manually create and authenticate an Azure OpenAI API
connection themselves inside the Logic App Designer.

This design makes every `logic-app` / `logic-app-storage` deployment
automatically provision a working Azure OpenAI API connection, pre-authenticated
against one shared Azure AI Foundry project (model: `gpt-5-mini`), so the user
only has to *pick* the existing connection when they add an action in the
Designer — no endpoint, no key, no connector auth screen.

## Background

- Both templates already build a Consumption-tier `Microsoft.Logic/workflows`
  resource via the shared `buildLogicApp()` builder
  (`functions/src/modules/deployments/arm-template-builder.ts`), with empty
  `actions`/`outputs` — the user builds the workflow body themselves in the
  Designer after deploy.
- The Foundry project (`coe-default`) and its `gpt-5-mini` model deployment
  already exist. Azure OpenAI–compatible endpoint:
  `https://coe-ai-foundry-eus2.openai.azure.com/openai/v1` (resource name
  `coe-ai-foundry-eus2`, region East US 2 — separate from the Logic App's own
  `malaysiawest` region; this is not a constraint, since the `azureopenai`
  managed connector only needs to exist in the Logic App's *own* region and
  calls out to whichever OpenAI-compatible endpoint it's configured with).
- One shared Foundry resource is used for every deployment (not one per
  deployment) — simplest, avoids per-deployment model-quota provisioning.

## Architecture

No new subsystem — this is one new builder function plus a switch-case
addition, following the exact same shape as every other builder in
`arm-template-builder.ts`.

`buildTemplateResources("logic-app" | "logic-app-storage", ...)` now also
calls a new `buildAzureOpenAiConnection()`, which emits a
`Microsoft.Web/connections` resource (the `azureopenai` managed connector, API
key auth) alongside the existing Logic App (and Storage Account, for
`logic-app-storage`). The connection is scoped to the deployment's own
resource group — every deployment gets its own connection resource, but they
all point at the same shared Foundry endpoint and key.

### Why API key, not managed identity

Two auth options exist for the `azureopenai` connector: API key or managed
identity (with the Logic App's MI granted `Cognitive Services OpenAI User` on
the Foundry resource). API key was chosen — simpler, no new role assignment
needed on the Foundry resource, no per-deployment MI wiring. Trade-off: the
shared key is baked into every deployment's ARM parameters (see Error Handling
/ secrets note below).

### Why a Function App env var, not Key Vault

An earlier draft of this design routed the API key through a shared Key
Vault, using ARM's `reference.keyVault` parameter-file mechanism (the only
supported way to pull a KV secret into a `Microsoft.Web/connections`
resource — there is no live/dynamic KV-reference syntax for this resource
type, unlike the `@Microsoft.KeyVault(...)` App Service app-settings trick).
That path was dropped for two reasons, discovered mid-design:

1. It needed a new one-time admin setup (dedicated Key Vault,
   `enabledForTemplateDeployment` flag, RBAC role assignment for both the
   Function App MI and the human creating secrets) that stalled on a
   `Forbidden by RBAC` error with no fast path to resolve.
2. It bought little real secrecy benefit — ARM stores the *resolved* secret
   value in deployment operation history the same way whether it came from a
   literal parameter or a KV reference. The KV indirection only protects the
   value at authoring time, not at rest in ARM's own deployment history.

Given this codebase's existing convention — *"No secrets in code or logs —
env vars / managed identity only"* (CLAUDE.md) — a plain Function App env var
is actually the more consistent choice, matching how `AZURE_STORAGE_CONNECTION_STRING`
and `SESSION_SECRET` already work. This also matches the existing
`pgAdminPassword` pattern in `buildCustomResources`, where a generated secret
is placed directly into `deployParams` as a literal `{ value }`.

## Components

### 1. New Function App env vars

Added to `functions/src/lib/env.ts`'s `envSchema` (same `z.string().min(1, ...)`
pattern as `AZURE_STORAGE_CONNECTION_STRING`):

- `FOUNDRY_API_KEY` — the Foundry/Azure OpenAI API key (secret)
- `FOUNDRY_RESOURCE_NAME` — `coe-ai-foundry-eus2` (not secret, the connector's
  "Azure OpenAI Resource Name" parameter)

Set as Function App Application Settings (`epf-sandbox-functions` →
Configuration), same blade as the existing required env vars documented in
`.claude/rules/azure-infra.md`.

### 2. New builder: `buildAzureOpenAiConnection()`

In `arm-template-builder.ts`, alongside the other single-resource builders:

```
function buildAzureOpenAiConnection(
  name: string,
  location: string,
  resourceName: string,
  deployParams: Record<string, { value: string }>
): ArmResource
```

- `type: "Microsoft.Web/connections"`, `apiVersion: "2016-06-01"`
- `properties.api.id` references the region's `azureopenai` managed API:
  `[concat(subscription().id, '/providers/Microsoft.Web/locations/', '<location>', '/managedApis/azureopenai')]`
- `properties.parameterValues`:
  - `azureOpenAIResourceName`: literal `resourceName` (from `FOUNDRY_RESOURCE_NAME`)
  - `azureOpenAIApiKey`: `[parameters('azureopenaiApiKey')]`
- Registers `deployParams["azureopenaiApiKey"] = { value: env.FOUNDRY_API_KEY }`
  (mirrors the `pgAdminPassword` pattern) — `buildArmTemplate()` already types
  any key present in `deployParams` as a `securestring` template parameter.
- Connection name derived the same way other resource names are (sanitized,
  suffixed with the deployment's unique suffix to avoid collisions across
  concurrent deployments in the same RG namespace, though RG scoping already
  makes this a non-issue in practice).

The exact JSON key names used in `parameterValues`
(`azureOpenAIResourceName` / `azureOpenAIApiKey`) should be confirmed once,
before implementation, against the live connector metadata:

```
GET https://management.azure.com/subscriptions/{sub}/providers/Microsoft.Web/locations/malaysiawest/managedApis/azureopenai?api-version=2016-06-01
```

(`connectionParameters` in the response is authoritative — Microsoft doesn't
publish the literal JSON keys in the connector reference docs, only the
human-readable field names/types.)

### 3. Switch-case wiring

`buildTemplateResources`'s `"logic-app"` and `"logic-app-storage"` cases each
append the new connection resource to their returned array. `logic-app`
becomes a 2-resource template (Logic App + connection); `logic-app-storage`
becomes 3 (Logic App + Storage Account + connection).

### 4. Policy allow-list

`POLICY_ALLOWED_RESOURCE_TYPES` in `arm-template-builder.ts` gains
`"Microsoft.Web/connections"` — otherwise `validateTemplateAgainstPolicy()`
blocks the template before it ever reaches Azure, since this set gates every
generated resource type regardless of mode.

## Data flow

Wizard submit (unchanged) → `POST /api/deployments` → queue → `processDeployment`
→ `buildArmTemplate` → `buildTemplateResources(slug, formValues)` now also
calls `buildAzureOpenAiConnection(...)`, appending both the connection
resource and its `deployParams` entry → `buildArmTemplate` types
`azureopenaiApiKey` as a `securestring` template parameter → `bicep-executor.ts`
submits the ARM PUT with `parameters: _deployParameters` (unchanged code path,
already handles arbitrary `deployParams` entries generically) → Azure creates
the Logic App and the Azure OpenAI connection in the same resource group.

No changes to: `web/lib/deployments/schema.ts`, `web/lib/deployments/policy.ts`
(no new form fields — the Foundry connection is not a user-configurable input).

One small `web/` change is in scope: `web/data/templates.json`'s `resourceCount`
field for `logic-app` and `logic-app-storage` bumps from `1`/`2` to `2`/`3`.
Precedent already set by `logic-app-storage` itself — its `resourceCount: 2`
counts every emitted ARM resource (Logic App + Storage Account), not just the
"primary" one — so the new connection resource should count too, for display
consistency.

## Error handling

No new error paths. If `FOUNDRY_API_KEY` or `FOUNDRY_RESOURCE_NAME` is unset,
`env.ts`'s existing fail-fast Zod validation throws at Function host startup
(same behavior as every other required env var going missing) — this is a
deploy-time/ops problem, not a per-deployment failure to handle specially.

**Secrets note:** the shared Foundry key is baked as a literal ARM deployment
parameter on every single deployment. It is never logged (deployment
parameters aren't logged by `bicep-executor.ts`'s `log?.()` calls) but it does
persist in each deployment's ARM operation history, viewable by anyone with
Reader on the resource group. This is an accepted trade-off of the shared
Foundry approach — rotating the key means no retroactive cleanup of prior
deployment history, only that future deployments pick up the new value.

## Testing

- `functions/src/__tests__/modules/deployments/arm-template-builder.test.ts`:
  new cases for `logic-app` (asserts 2 resources, 2nd is
  `Microsoft.Web/connections` with `parameterValues.azureOpenAIResourceName`
  matching a mocked `FOUNDRY_RESOURCE_NAME`) and `logic-app-storage` (asserts
  3 resources, connection is present regardless of position).
- `functions/src/__tests__/modules/deployments/bicep-executor.test.ts`: assert
  the constructed `deployParams` includes `azureopenaiApiKey` with the mocked
  `FOUNDRY_API_KEY` value.
- `functions/src/__tests__/lib/env.test.ts` (if it exists — create if not):
  add cases for the two new required env vars.
- Full gate re-run after: `npx tsc --noEmit` + `npx vitest run` in `functions/`.
  No `web/` changes, so no `web/` gate re-run needed.

## Out of scope

- No change to `approval-workflow`, `scheduled-automation`, or
  `static-web-app` (none of these are exposed in the active catalog; if
  reactivated later, this same connection could be added to them, but that's
  a separate decision).
- No managed-identity auth path for the connector (API key only, see
  Architecture).
- No per-deployment Foundry resource provisioning — one shared resource for
  all deployments.
- No workflow *actions* pre-wired into the Logic App definition (`actions: {}`
  stays empty) — the user still builds the actual workflow logic in the
  Designer; this design only removes the *connection setup* step, matching
  the stated goal ("user doesn't need to configure the API for the AI model").
- No Key Vault involvement (see Architecture — considered and dropped).

## Open risks (verify before/during implementation)

1. Whether subscription policy `COE-Allowed-Resources` (an Azure Policy,
   separate from this app's own `POLICY_ALLOWED_RESOURCE_TYPES` check) permits
   `Microsoft.Web/connections` — unverified, could block the ARM deployment
   at the Azure level even after our own code allows it.
2. Whether the `azureopenai` managed connector is available in the
   `malaysiawest` region — connector regional availability varies and hasn't
   been checked against the live `managedApis` listing.
3. The exact `parameterValues` JSON key names for the `azureopenai` connector
   should be confirmed via the live connector metadata endpoint (see
   Components §2) rather than assumed from documentation, which only
   describes human-readable field names.
