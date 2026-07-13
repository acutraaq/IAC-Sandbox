---
description: Azure managed identity setup checklist and verification steps for IAC Sandbox
globs: functions/src/**
---

# Azure Infrastructure Setup

**Status: All steps confirmed complete.** Steps 1–5 done: Function App MI enabled, App Service MI enabled, Contributor role on sub-epf-sandbox-internal granted to Function App MI, Reader role on sub-epf-sandbox-internal granted to App Service MI, Function App env vars set (`DEPLOYMENT_QUEUE`, `AZURE_STORAGE_CONNECTION_STRING`, `AzureWebJobsStorage`, `AZURE_SUBSCRIPTION_ID`, `AZURE_TENANT_ID`).

> Once Steps 1–4 are complete, verify with `curl https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net/api/healthz/arm` → `{"status":"ok"}`.

## Admin checklist (one-time, Azure Portal)

**Step 1 — Enable System-Assigned Managed Identity on the Function App**

Portal path: `epf-sandbox-functions` → Identity → System assigned → Status **On** → Save  
Note the **Object (principal) ID** shown after saving.

**Step 2 — Enable System-Assigned Managed Identity on the App Service**

Portal path: `epf-experimental-sandbox-playground` → Identity → System assigned → Status **On** → Save  
Note the **Object (principal) ID** shown after saving.

**Step 3 — Grant Function App MI: Contributor on sub-epf-sandbox-internal** (✅ Done by user)

Portal path: Subscriptions → `sub-epf-sandbox-internal` (`1fed33d2-00fd-40a8-a5c1-c120aec1b902`) → Access control (IAM) → Add role assignment

| Field | Value |
|-------|-------|
| Role | **Contributor** |
| Assign access to | Managed identity |
| Member | `epf-sandbox-functions` (Object ID from step 1) |

Required so the Function App can create resource groups and deploy ARM resources in the internal sub.

**Step 4 — Grant App Service MI: Reader on sub-epf-sandbox-internal**

Same IAM blade, same subscription:

| Field | Value |
|-------|-------|
| Role | **Reader** |
| Assign access to | Managed identity |
| Member | `epf-experimental-sandbox-playground` (Object ID from step 2) |

Required so the web app can list resource groups by tag and read ARM deployment status for the polling and My Stuff pages.

**Step 5 — Verify Function App Application Settings**

Portal path: `epf-sandbox-functions` → Configuration → Application settings

| Setting name | Required value |
|---|---|
| `AZURE_SUBSCRIPTION_ID` | `1fed33d2-00fd-40a8-a5c1-c120aec1b902` |
| `AZURE_TENANT_ID` | `3335e1a2-2058-4baf-b03b-031abf0fc821` |
| `DEPLOYMENT_QUEUE` | Full Azure Storage connection string for `coeiacsandbox8bfc` (same value as `AZURE_STORAGE_CONNECTION_STRING` on the App Service) |
| `AZURE_STORAGE_CONNECTION_STRING` | Same as `DEPLOYMENT_QUEUE` — used by the poison-queue handler to write dead-letter failure records to blob storage |
| `AzureWebJobsStorage` | Same storage connection string — required by the Functions runtime itself for internal state |
| `FOUNDRY_API_KEY` | Azure AI Foundry / Azure OpenAI API key (shared resource used by every logic-app / logic-app-storage deployment) |
| `FOUNDRY_RESOURCE_NAME` | Azure OpenAI resource name (the subdomain segment of the endpoint, e.g. `coe-ai-foundry-eus2` from `https://coe-ai-foundry-eus2.openai.azure.com`) |
| `FOUNDRY_MODEL_DEPLOYMENT_NAME` | The model deployment name in the Foundry project (e.g. `gpt-5.4-mini-1`) — check Foundry portal → Use a model → View deployments for the exact name; not necessarily the model family name |

> `logic-app`/`logic-app-storage` ship both an auto-provisioned `Microsoft.Web/connections` (Azure OpenAI connector, dropdown-pickable for any future action) and a pre-wired HTTP action already baked into the deployed Logic App's own workflow parameters (`foundryApiKey`/`foundryEndpoint`) — runnable with zero configuration out of the box. The connector-only design was tried first and hit a subscription-level `COE-Allowed-Resources` policy `Deny` on its first real deployment (confirmed via Activity Log); it was then dropped for a connector-free workflow-parameters-only design; the policy owner separately unblocked `Microsoft.Web/connections`, so the connector came back alongside the workflow parameters. See `docs/superpowers/specs/2026-07-13-logic-app-foundry-connection-design.md` Revision 3 for the full story. A missing/wrong `FOUNDRY_API_KEY`/`FOUNDRY_RESOURCE_NAME`/`FOUNDRY_MODEL_DEPLOYMENT_NAME` still fails permanently (`InvalidDeploymentConfigError`, no retry), so a stuck-at-`accepted` deployment for these two slugs specifically should prompt a check of these three env vars.

Click **Save** after any changes; allow the Function App to restart.

> ⚠️ If `DEPLOYMENT_QUEUE` or `AZURE_STORAGE_CONNECTION_STRING` is missing, `env.ts` throws on startup → Function host fails to load → queue trigger never activates → all messages stay stuck at `accepted` forever.

## Verification

```sh
# Should return {"status":"ok"} — confirms App Service MI can reach sub-epf-sandbox-internal
curl https://epf-experimental-sandbox-playground-cvhdbjgdcqabdjau.southeastasia-01.azurewebsites.net/api/healthz/arm
```

If `{"status":"error",...}`:
- Token error → managed identity not enabled or credential chain failure
- ARM 403 → Reader role not yet assigned on sub-epf-sandbox-internal
- ARM 404 → subscription ID mismatch in App Service env vars

After that passes, submit a test template deployment (e.g., Storage Account) and confirm a resource group appears in sub-epf-sandbox-internal with all 6 ARM tags.

For Function App managed identity verification, the HTTP trigger `healthz` function (exposed at `https://epf-sandbox-functions-d2f0a8huescxghgq.southeastasia-01.azurewebsites.net/api/healthz`) can be used as a quick probe — it acquires an ARM token via `DefaultAzureCredential` and returns `{"status":"ok","mi":true}`.
