# Design: Auto-wired Azure OpenAI (Foundry) connection on Logic App templates

**Date:** 2026-07-13
**Status:** Superseded by Revision 2 (below) — the original `Microsoft.Web/connections` approach was implemented, merged, and deployed, then failed on first real deployment. Kept for history; do not implement §1-§Open risks below, see Revision 2 for what actually ships.

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

---

## Revision 2 (2026-07-13, same day): drop the connector entirely

**Status:** Active — this is what actually ships.

### What happened

Risk #1 above was real, not theoretical. First real deployment of the
Revision-1 design produced an Activity Log entry: `'deny' Policy action` on
`Microsoft.Web/connections`, from the `COE-Allowed-Resources` custom policy
definition (`066af5f7af7e450cadea3b04`). That policy is a hardcoded `Deny`
on any resource `type` not in a fixed allow-list — confirmed via `View
definition`, `Microsoft.Web/connections` is absent from the list. The
assignment has zero parameters (the allow-list is baked into the policy
*rule* itself, not a parameter), so there's no assignment-level override.

Fixing it requires either editing the custom policy definition (owned by
`ahmad-adib@epf.gov.my`, needs `Resource Policy Contributor` or higher — the
deploying user didn't have this) or a scoped Policy Exemption (same
permission tier). Both are governance actions outside this app's control,
and — critically — outside what this design should ever require just to
ship a feature. **Decision: stop depending on a resource type that needs a
policy-owner favor. Redesign around only resource types already allowed.**

### New architecture: no companion resource at all

Instead of a separate `Microsoft.Web/connections` resource, the Foundry
credentials are baked directly into the `Microsoft.Logic/workflows` resource
itself — via the Logic App's own **workflow-definition parameters**, a
first-class part of the Consumption Logic App schema (`definition.parameters`
declares the parameter and its type; the resource's `properties.parameters`
supplies the deploy-time value — same two-part shape ARM already uses
everywhere else, just scoped to the workflow instead of a connector).

This requires zero new resource types — `Microsoft.Logic/workflows` was
already on the `COE-Allowed-Resources` list from day one. No policy edit, no
policy exemption, no new admin ask at all.

**Auth model also changes:** managed-identity auth (the alternative
considered and dropped in Revision 1) was reconsidered here too, since it
would need a `Microsoft.Authorization/roleAssignments` resource scoped to
the Foundry Cognitive Services account — which lives in a different
subscription/resource group than `sub-epf-sandbox-internal`, and would
require the Function App's MI to hold `User Access Administrator` (or
`Owner`) on that specific external resource. Given the current session
already hit one governance wall on this feature, and the user assessed this
second permission ask as equally likely to stall, this path was **not**
pursued. Revision 2 stays with API-key auth, now carried as a Logic
App–scoped `securestring` parameter instead of a connector parameter.

### Components (Revision 2)

- **`buildLogicApp()` gains an optional 5th parameter**,
  `foundry?: { apiKey: string; resourceName: string; deployParams: Record<string, { value: string }> }`.
  When present:
  - `deployParams["azureopenaiApiKey"] = { value: apiKey }` (unchanged
    mechanism from Revision 1 — `buildArmTemplate()` still types any
    `deployParams` key as a `securestring` top-level ARM template parameter).
  - The returned resource's `properties.definition.parameters` gains:
    ```json
    {
      "foundryApiKey": { "type": "securestring" },
      "foundryEndpoint": { "type": "string" }
    }
    ```
  - The returned resource's `properties.parameters` (sibling to
    `definition`, supplies the actual values) gains:
    ```json
    {
      "foundryApiKey": { "value": "[parameters('azureopenaiApiKey')]" },
      "foundryEndpoint": { "value": "https://<resourceName>.openai.azure.com" }
    }
    ```
  - `approval-workflow`/`scheduled-automation`'s existing calls (4 args, no
    `foundry`) are unaffected — the parameter is optional and those two
    slugs never pass it.
- **`buildAzureOpenAiConnection()` is deleted entirely** — no
  `Microsoft.Web/connections` resource is ever built.
- **`POLICY_ALLOWED_RESOURCE_TYPES` loses `"Microsoft.Web/connections"`** —
  added in Revision 1, now dead weight since nothing emits that type.
- **`requireFoundryConfig()` is unchanged** — same guard, same
  `InvalidDeploymentConfigError`, same call sites in the `"logic-app"` /
  `"logic-app-storage"` switch cases, just now passed into `buildLogicApp()`
  instead of a separate `buildAzureOpenAiConnection()` call.
- **`bicep-executor.ts` is unchanged** — it already threads
  `foundryApiKey`/`foundryResourceName` into `buildArmTemplate()`'s `opts`;
  that data flow doesn't care which builder consumes the values downstream.
- **`web/data/templates.json`'s `resourceCount` reverts** to `1` (logic-app)
  / `2` (logic-app-storage) — back to their pre-feature values, since no
  companion resource is created anymore. The Revision-1 bump to `2`/`3` is
  undone.
- **Docs (`CLAUDE.md`, `.claude/rules/templates.md`,
  `.claude/rules/azure-infra.md`) get corrected** to describe workflow
  parameters instead of an API connection — the `FOUNDRY_API_KEY` /
  `FOUNDRY_RESOURCE_NAME` env vars stay exactly as they were (same source,
  same Function App setting, just consumed differently downstream).

### User-facing behavior change

Previously (Revision 1): user opens the Logic App Designer, adds an action,
picks the pre-existing "Azure OpenAI" connection from a dropdown — zero
typing.

Now (Revision 2): user opens the Logic App Designer, adds a plain **HTTP**
action (native, not a connector), and references `@parameters('foundryApiKey')`
and `@parameters('foundryEndpoint')` from the dynamic-content picker when
filling in the request URL and auth header. Slightly more manual than a
connector dropdown, but still means the user never has to leave the
Designer to fetch a key from the Foundry portal — the stated goal from the
original ask is preserved, just via native HTTP instead of a managed
connector.

### Out of scope (Revision 2, supersedes Revision 1's list)

- No `Microsoft.Web/connections` resource, ever, for these two slugs.
- No managed-identity/role-assignment path (considered, dropped — see
  Auth model above).
- No Key Vault involvement (already dropped in Revision 1, still true).
- No change to `approval-workflow`/`scheduled-automation`/`static-web-app`
  (still dormant, not in the active catalog).

### New testing requirements

- `arm-template-builder.test.ts`: `logic-app` reverts to asserting 1
  resource (Logic App only), now also asserting
  `properties.parameters.foundryApiKey.value === "[parameters('azureopenaiApiKey')]"`
  and `properties.definition.parameters.foundryApiKey.type === "securestring"`.
  `logic-app-storage` reverts to asserting 2 resources (Logic App +
  Storage), same parameter assertions on the Logic App resource. The
  `Microsoft.Web/connections`-specific describe block from Revision 1 is
  deleted, not left dangling.
- No new `bicep-executor.test.ts` cases needed beyond what Revision 1 already
  added (that test only checks the deploy parameter propagates — the
  mechanism it verifies didn't change).
