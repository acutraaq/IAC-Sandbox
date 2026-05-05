---
description: Template catalog — 16 templates, policy-blocked slugs, region constraints, and deployable allow-list for IAC Sandbox
globs: web/app/templates/**, web/data/**, web/lib/deployments/**
---

# Template Catalog

16 templates across 6 categories. All region options are locked to:
- Asia Pacific (Southeast Asia)
- Asia Pacific (East Asia)
- Asia Pacific (Australia East)

| Category | Slug | Resource Type |
|----------|------|---------------|
| compute | `web-application` | `Microsoft.Web/serverfarms` + `Microsoft.Web/sites` |
| compute | `virtual-machine` | `Microsoft.Compute/virtualMachines` — policy-blocked, shows lock UI |
| compute | `container-app` | `Microsoft.App/managedEnvironments` + `Microsoft.App/containerApps` |
| compute | `full-stack-web-app` | App Service + Azure SQL + Storage + Key Vault (6 resources) |
| compute | `microservices-platform` | Container Apps + Service Bus — policy-blocked |
| data | `database` | `Microsoft.DBforPostgreSQL/flexibleServers` |
| data | `storage-account` | `Microsoft.Storage/storageAccounts` |
| data | `data-pipeline` | policy-blocked |
| security | `key-vault` | `Microsoft.KeyVault/vaults` |
| security | `secure-api-backend` | policy-blocked |
| network | `virtual-network` | `Microsoft.Network/virtualNetworks` |
| network | `landing-zone` | VNet + Key Vault + Log Analytics (conditional) |
| automation | `approval-workflow` | `Microsoft.Logic/workflows` (HTTP trigger) |
| automation | `scheduled-automation` | `Microsoft.Logic/workflows` (recurrence trigger) |
| integration | `message-queue` | `Microsoft.ServiceBus/namespaces` |
| integration | `event-broadcaster` | `Microsoft.EventGrid/topics` |

Policy-blocked slugs (enforced server-side at `POST /api/deployments` → 403):
- `virtual-machine`, `microservices-platform`, `data-pipeline`, `secure-api-backend`

Deployable slugs (allow-list in `web/lib/deployments/policy.ts`):
- `web-application`, `database`, `storage-account`, `key-vault`, `virtual-network`, `container-app`, `landing-zone`, `full-stack-web-app`, `approval-workflow`, `scheduled-automation`, `message-queue`, `event-broadcaster`

> When adding a new deployable slug, update BOTH `web/lib/deployments/policy.ts` (DEPLOYABLE_SLUGS) AND `web/lib/deployments/rg-name.ts` (primary field map).
