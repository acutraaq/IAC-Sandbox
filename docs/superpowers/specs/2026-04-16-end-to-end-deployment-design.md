# End-to-End Deployment Design
**Date:** 2026-04-16
**Scope:** Wire frontend → backend → real Azure resource provisioning

---

## Goal

When a user completes the template or custom builder flow and clicks **Submit for Deployment**, real Azure resources are created in the organisation's subscription. Each submission creates its own resource group, named from the user's primary name input, containing the selected resources.

---

## What Is In Scope

- Replace the empty ARM template in `bicep-executor.ts` with real ARM JSON per resource type
- Auto-derive resource group name from user's primary name input (no new UI field)
- Create the resource group before deploying into it
- Disable MSW mock so frontend calls reach the real backend
- Add resource group name to the proof report
- Use Azure CLI credentials (`az login`) — no service principal or admin required
- Add `AZURE_SUBSCRIPTION_ID` and `AZURE_TENANT_ID` to `.env`; no secrets needed

## What Is Out of Scope

- JWT / Entra ID authentication (Phase B3 — deferred)
- Rate limiting, CORS hardening (Phase B3 — deferred)
- Polling / real-time status updates in the frontend
- Resource deletion or lifecycle management

---

## Architecture

### Deployment Flow

```
User submits (frontend)
  → POST /deployments { mode, template|resources }
  → Backend validates payload
  → Saves to DB (status: accepted)
  → Returns 201 { submissionId }
  → [async] Creates resource group in Azure
  → [async] Deploys ARM template into resource group
  → Updates DB: succeeded | failed
```

### Resource Group Naming

The backend derives the resource group name from the payload — no extra field exposed in the API.

**Template mode:** each slug maps to a known primary name field in `formValues`:

| Slug | Primary name field | Example RG name |
|---|---|---|
| web-application | `appName` | `my-app-rg` |
| virtual-machine | `vmName` | `my-vm-rg` |
| database | `dbName` | `my-database-rg` |
| storage-account | `storageName` | `myfiles-rg` |
| virtual-network | `vnetName` | `my-network-rg` |
| key-vault | `vaultName` | `my-secrets-rg` |
| container-app | `appName` | `my-container-app-rg` |
| landing-zone | `projectName` | `my-project-rg` |

**Custom mode:** uses the first selected resource's `name` field.

**Sanitisation:** lowercase, spaces → hyphens, strip invalid Azure chars, truncate to 87 chars (leaving room for `-rg`), append `-rg`.

---

## Backend Changes

### New: `arm-template-builder.ts`

Single entry point:
```ts
buildArmTemplate(payload: DeploymentPayload): ArmTemplate
```

Internally dispatches to per-resource-type builder functions. Returns a complete ARM JSON object with `$schema`, `contentVersion`, `parameters: {}`, `resources: [...]`, `outputs: {}`.

**Template mode — ARM resources per slug:**

| Slug | ARM resources |
|---|---|
| web-application | `Microsoft.Web/serverfarms` (App Service Plan) + `Microsoft.Web/sites` (Web App) |
| virtual-machine | `Microsoft.Network/virtualNetworks` + `Microsoft.Network/networkInterfaces` + `Microsoft.Network/publicIPAddresses` + `Microsoft.Compute/virtualMachines` |
| database | `Microsoft.DBforPostgreSQL/flexibleServers` |
| storage-account | `Microsoft.Storage/storageAccounts` |
| virtual-network | `Microsoft.Network/virtualNetworks` |
| key-vault | `Microsoft.KeyVault/vaults` |
| container-app | `Microsoft.App/managedEnvironments` + `Microsoft.App/containerApps` |
| landing-zone | `Microsoft.Network/virtualNetworks` + `Microsoft.Network/networkSecurityGroups` + `Microsoft.KeyVault/vaults` + (if includeMonitoring) `Microsoft.OperationalInsights/workspaces` |

**Custom mode:** each selected resource type maps to its ARM resource definition. Multiple selected resources are combined into one `resources` array in a single ARM template.

### Modified: `bicep-executor.ts`

Renamed conceptually to `arm-deployer.ts` (or file kept, logic replaced). Two-step process:

1. **Create resource group** — `client.resourceGroups.createOrUpdate(rgName, { location })`
2. **Deploy ARM template** — `client.deployments.beginCreateOrUpdateAndWait(rgName, deploymentName, { ... })`

The location is extracted from the payload's `region` field (present in all resource configs).

### Modified: `deployment.service.ts`

No structural change. The `executeBicepDeployment` call is replaced by the new two-step ARM deployer. The `bicepOutput` stored in DB will contain the ARM deployment outputs.

### Modified: `src/lib/env.ts`

`AZURE_SUBSCRIPTION_ID` already present. Add `AZURE_TENANT_ID` as a required field. No client ID or secret needed — `DefaultAzureCredential` picks up Azure CLI session credentials automatically when the developer runs `az login`.

**Pre-requisite (one-time, run in terminal before starting the backend):**
```sh
az login
az account set --subscription bcef681c-2e70-4357-8fa3-c36b558d61da
```

### Modified: `backend/.env`

```
AZURE_SUBSCRIPTION_ID=bcef681c-2e70-4357-8fa3-c36b558d61da
AZURE_TENANT_ID=3335e1a2-2058-4baf-b03b-031abf0fc821
```

No secrets required. `DefaultAzureCredential` uses the Azure CLI login automatically.

---

## Frontend Changes

### Disable MSW mock

Find MSW initialisation (likely in `app/layout.tsx` or a provider component) and remove the registration call. The `mocks/handlers.ts` file is kept untouched — it remains useful for running tests.

### Modified: `lib/report.ts`

Add one line to the proof artifact output:
```
Resource Group : {derived-rg-name}
```

The resource group name is derived client-side using the same logic as the backend (same primary name field + `-rg`) so it can be shown in the proof report without an extra API call.

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Not logged into Azure CLI | Deployment → `failed`, message: "Run az login before starting the backend" |
| Resource group creation fails | Deployment → `failed`, ARM error message stored |
| ARM deployment fails | Deployment → `failed`, ARM error message stored |
| Invalid resource name (Azure rules) | ARM rejects it, caught and stored as `failed` |
| Network error to Azure | Caught, stored as `failed` |

---

## Files Changed

| File | Action |
|---|---|
| `backend/src/modules/deployments/arm-template-builder.ts` | New |
| `backend/src/modules/deployments/bicep-executor.ts` | Replace `buildArmTemplate` + add RG creation |
| `backend/src/lib/env.ts` | Add `AZURE_TENANT_ID` |
| `backend/.env` | Add `AZURE_SUBSCRIPTION_ID` + `AZURE_TENANT_ID` values |
| `frontend/app/layout.tsx` (or MSW provider) | Remove MSW registration |
| `frontend/lib/report.ts` | Add resource group line |
