#!/usr/bin/env bash
# configure-function-app-env.sh
# ---------------------------------------------------------------------------
# One-time script to configure required Application Settings on the
# epf-sandbox-functions Function App, then restart it.
#
# Do NOT commit this script with real connection strings.
# Usage:
#   export AZFN_STORAGE_CS="DefaultEndpointsProtocol=..."
#   export AZFN_SUBSCRIPTION="1fed33d2-00fd-40a8-a5c1-c120aec1b902"
#   export AZFN_TENANT="3335e1a2-2058-4baf-b03b-031abf0fc821"
#   bash scripts/configure-function-app-env.sh
# ---------------------------------------------------------------------------

set -euo pipefail

# --- User-provided values (set as env vars before running) -----------------
STORAGE_CS="${AZFN_STORAGE_CS:-}"
SUBSCRIPTION_ID="${AZFN_SUBSCRIPTION_ID:-}"
TENANT_ID="${AZFN_TENANT_ID:-}"

# --- Defaults from project conventions --------------------------------------
SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-1fed33d2-00fd-40a8-a5c1-c120aec1b902}"
TENANT_ID="${TENANT_ID:-3335e1a2-2058-4baf-b03b-031abf0fc821}"

RESOURCE_GROUP="rg-epf-sandbox"
FUNCTION_APP_NAME="epf-sandbox-functions"

if [[ -z "$STORAGE_CS" ]]; then
  echo "ERROR: AZFN_STORAGE_CS is not set. Export the storage connection string before running."
  exit 1
fi

echo "Configuring Function App: $FUNCTION_APP_NAME"
echo "Subscription: $SUBSCRIPTION_ID"
echo "Tenant:       $TENANT_ID"

# --- Set Application Settings -----------------------------------------------
az functionapp config appsettings set \
  --name "$FUNCTION_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --settings \
    "DEPLOYMENT_QUEUE=$STORAGE_CS" \
    "AZURE_STORAGE_CONNECTION_STRING=$STORAGE_CS" \
    "AzureWebJobsStorage=$STORAGE_CS" \
    "AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID" \
    "AZURE_TENANT_ID=$TENANT_ID" \
    "WEBSITE_RUN_FROM_PACKAGE=1" \
  --output none

echo "Application settings updated."

# --- Restart ----------------------------------------------------------------
echo "Restarting Function App..."
az functionapp restart \
  --name "$FUNCTION_APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --output none

echo "Restart triggered. Allow ~30 s for the host to come back online."
echo "Verify with:"
echo "  curl https://epf-sandbox-functions-d2f0a8huescxghgq.southeastasia-01.azurewebsites.net/api/healthz"
