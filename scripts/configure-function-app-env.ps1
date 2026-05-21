# configure-function-app-env.ps1
# ---------------------------------------------------------------------------
# One-time script to configure required Application Settings on the
# epf-sandbox-functions Function App, then restart it.
#
# Do NOT commit this script with real connection strings.
# Usage:
#   $env:AZFN_STORAGE_CS = "DefaultEndpointsProtocol=..."
#   .\scripts\configure-function-app-env.ps1
# ---------------------------------------------------------------------------

$ErrorActionPreference = "Stop"

# --- User-provided values (set as env vars before running) -----------------
$storageCs = $env:AZFN_STORAGE_CS
$subscriptionId = if ($env:AZFN_SUBSCRIPTION_ID) { $env:AZFN_SUBSCRIPTION_ID } else { "1fed33d2-00fd-40a8-a5c1-c120aec1b902" }
$tenantId = if ($env:AZFN_TENANT_ID) { $env:AZFN_TENANT_ID } else { "3335e1a2-2058-4baf-b03b-031abf0fc821" }

$resourceGroup = "rg-epf-sandbox"
$functionAppName = "epf-sandbox-functions"

if (-not $storageCs) {
    Write-Error "ERROR: AZFN_STORAGE_CS is not set. Export the storage connection string before running."
    exit 1
}

Write-Host "Configuring Function App: $functionAppName"
Write-Host "Subscription: $subscriptionId"
Write-Host "Tenant:       $tenantId"

# --- Set Application Settings -----------------------------------------------
az functionapp config appsettings set `
    --name $functionAppName `
    --resource-group $resourceGroup `
    --settings `
        "DEPLOYMENT_QUEUE=$storageCs" `
        "AZURE_STORAGE_CONNECTION_STRING=$storageCs" `
        "AzureWebJobsStorage=$storageCs" `
        "AZURE_SUBSCRIPTION_ID=$subscriptionId" `
        "AZURE_TENANT_ID=$tenantId" `
        "WEBSITE_RUN_FROM_PACKAGE=1" `
    --output none

Write-Host "Application settings updated."

# --- Restart ----------------------------------------------------------------
Write-Host "Restarting Function App..."
az functionapp restart `
    --name $functionAppName `
    --resource-group $resourceGroup `
    --output none

Write-Host "Restart triggered. Allow ~30 s for the host to come back online."
Write-Host "Verify with:"
Write-Host "  curl https://epf-sandbox-functions-d2f0a8huescxghgq.southeastasia-01.azurewebsites.net/api/healthz"
