---
name: schema-drift
description: Manually check web/functions deployment schema parity before pushing — catches what CI's sed-based drift check may miss
---

# Schema Drift Check

## Overview
`web/lib/deployments/schema.ts` and `functions/src/modules/deployments/deployment.schema.ts` must stay in sync (CLAUDE.md §Canonical Patterns — "Schema sync"). CI runs an always-on drift job (`.claude/rules/cicd.md` — not path-filter-gated), but it's a hand-tuned `diff`/`sed` pipeline, not a semantic check (known gap, see HANDOFF.md). It can miss drift that changes meaning without changing the diffable text shape.

Invoke this whenever either schema file is edited, before relying on CI to catch it.

## What to compare

1. Read both files:
   - `web/lib/deployments/schema.ts`
   - `functions/src/modules/deployments/deployment.schema.ts`
2. For every field/shape present in one, confirm the other has a matching Zod definition — same field names, same optionality, same enum values, same nested shape.
3. Check `deploymentJobMessageSchema` / `DeploymentJobMessage` in the functions file — this is the queue message contract (single source of truth per CLAUDE.md); confirm the web side's enqueue payload actually matches what this schema expects, not just that the two schema files look similar.
4. Check `DEPLOYABLE_SLUGS` (`web/lib/deployments/policy.ts`) against whatever slug allow-list exists on the functions side (`ALLOWED_RESOURCE_TYPES` scoping) — these are hand-duplicated with no automated equality check (known gap, see HANDOFF.md).

## On finding drift
Fix both files in the same commit — CLAUDE.md is explicit: "edit both together." Do not fix one side and leave a follow-up TODO.
