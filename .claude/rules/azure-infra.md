---
description: Azure managed identity setup checklist and verification steps for IAC Sandbox
globs: functions/src/**
---

# Azure Infrastructure Setup

**Status: Pending admin action.** The code is correct. The Function App and App Service use `DefaultAzureCredential()` which resolves to Managed Identity in Azure. The managed identities have not been enabled or granted cross-subscription access yet.

## Admin checklist (one-time, Azure Portal)

**Step 1 — Enable System-Assigned Managed Identity on the Function App**

Portal path: `epf-sandbox-functions` → Identity → System assigned → Status **On** → Save  
Note the **Object (principal) ID** shown after saving.

**Step 2 — Enable System-Assigned Managed Identity on the App Service**

Portal path: `epf-experimental-sandbox-playground` → Identity → System assigned → Status **On** → Save  
Note the **Object (principal) ID** shown after saving.

**Step 3 — Grant Function App MI: Contributor on sub-epf-sandbox-internal**

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

Click **Save** after any changes; allow the Function App to restart.

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
