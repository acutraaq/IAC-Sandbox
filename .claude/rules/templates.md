---
description: Template catalog — live templates in templates.json, DEPLOYABLE_SLUGS allow-list, region constraints, and ARM builder inventory for IAC Sandbox
globs: web/app/templates/**, web/data/**, web/lib/deployments/**
---

# Template Catalog

2 templates, both automation category — live in `web/data/templates.json`. Region is locked to Malaysia West only — no region field in any wizard.

`static-web-app`, `approval-workflow`, and `scheduled-automation` were pulled from the catalog for now so the catalog is a minimal Logic-App-only pair. ARM builders + resource types stay allowed (see inventory table below) — re-adding any of them is a 3-line reversal, see checklist.

| Category | Slug | Resource Type |
|----------|------|---------------|
| automation | `logic-app` | `Microsoft.Logic/workflows` (HTTP trigger, blank) |
| automation | `logic-app-storage` | `Microsoft.Logic/workflows` (HTTP trigger) + `Microsoft.Storage/storageAccounts` |

Deployable slugs (allow-list in `web/lib/deployments/policy.ts` — **must exactly match what is in `templates.json`**):
- `logic-app`, `logic-app-storage`

Policy-blocked slugs: none (both active slugs are deployable).

## ARM Builder Inventory (beyond current UI catalog)

`functions/src/modules/deployments/arm-template-builder.ts` contains builders for additional slugs that are NOT yet exposed in `templates.json` or `DEPLOYABLE_SLUGS`:

| Slug | Resource Type |
|------|---------------|
| `approval-workflow` | `Microsoft.Logic/workflows` (HTTP trigger) — pulled from catalog for now, see note above |
| `scheduled-automation` | `Microsoft.Logic/workflows` (recurrence trigger) — pulled from catalog for now, see note above |
| `static-web-app` | `Microsoft.Web/staticSites` (pulled from catalog for now — see note above) |
| `web-application` | `Microsoft.Web/serverfarms` + `Microsoft.Web/sites` |
| `container-app` | `Microsoft.App/managedEnvironments` + `Microsoft.App/containerApps` |
| `full-stack-web-app` | App Service + Azure SQL + Storage + Key Vault |
| `database` | `Microsoft.DBforPostgreSQL/flexibleServers` |
| `storage-account` | `Microsoft.Storage/storageAccounts` |
| `key-vault` | `Microsoft.KeyVault/vaults` |
| `virtual-network` | `Microsoft.Network/virtualNetworks` |
| `landing-zone` | VNet + Key Vault + Log Analytics |
| `message-queue` | `Microsoft.ServiceBus/namespaces` |
| `event-broadcaster` | `Microsoft.EventGrid/topics` |

> To activate any of these: add an entry to `templates.json`, add the slug to `DEPLOYABLE_SLUGS` in `web/lib/deployments/policy.ts`, and add a primary field entry to `SLUG_PRIMARY_FIELD` in `web/lib/deployments/rg-name.ts`.

## Adding a New Template (checklist)

1. Add entry to `web/data/templates.json` (slug, name, category, steps, fields)
2. Add slug to `DEPLOYABLE_SLUGS` in `web/lib/deployments/policy.ts`
3. Add slug → primary form field mapping in `SLUG_PRIMARY_FIELD` in `web/lib/deployments/rg-name.ts`
4. Verify ARM builder exists in `functions/src/modules/deployments/arm-template-builder.ts`; add if missing
5. Run `npx vitest run` from both `web/` and `functions/` — all must pass
