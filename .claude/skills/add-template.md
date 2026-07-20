---
name: add-template
description: Checklist for adding or re-activating a deployable template slug in IAC Sandbox — every step required, source of truth is .claude/rules/templates.md
---

# Add a Template

## Overview
Adding a new deployable slug (or re-activating one of the 13 ARM builders not currently exposed — see `.claude/rules/templates.md` inventory) touches 4 files that must all move together. Missing any one leaves the slug half-wired: buildable but not deployable, or deployable but not RG-nameable.

## Checklist

1. **`web/data/templates.json`** — add the entry: slug, name, category, steps, fields.
2. **`web/lib/deployments/policy.ts`** — add the slug to `DEPLOYABLE_SLUGS`. Without this, `POST /api/deployments` returns 403 (`AppError.forbidden()`) even though the wizard lets the user configure it.
3. **`web/lib/deployments/rg-name.ts`** — add slug → primary field mapping in `SLUG_PRIMARY_FIELD`. Without this, `deriveResourceGroupName` has no field to derive a name from.
4. **`functions/src/modules/deployments/arm-template-builder.ts`** — verify a builder exists for the slug; add one if missing. Without this, the message poison-queues after 3 retries (`host.json` `maxDequeueCount`) with no ARM resource ever created.
5. **`functions/src/modules/deployments/deployment.schema.ts`** — if the slug needs new fields, mirror them here too (see `schema-drift` skill — web/functions schemas are hand-synced, not automated).

## Verify

```bash
cd web && npx vitest run
cd functions && npx vitest run
```

Both must pass — add/extend a test for the new slug's builder and policy allow-list rather than relying on existing coverage.

## Rules
- Do this in one commit/session — a slug added to `templates.json` but not `DEPLOYABLE_SLUGS` is reachable in the UI but rejected at submit, which is a worse user experience than not shipping the step at all.
- If re-activating a pulled slug (`approval-workflow`, `scheduled-automation`, `static-web-app`), the ARM builder already exists — steps 1–3 only.
- Region stays locked to Malaysia West — do not add a region field to any new template's `fields`.
