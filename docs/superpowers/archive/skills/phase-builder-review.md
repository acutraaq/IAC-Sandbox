---
name: phase-builder-review
description: Custom builder + review/submit flow (Phases 3c–3d): ResourceCatalog, ResourceDrawer, SelectedPanel, ReviewSection, SubmitButton, ConfirmModal, proof artifact
archived: true
archived_date: 2026-05-02
reason: All phases complete and shipped. Archived to prevent accidental re-execution.
---

# Phase: Builder + Review/Submit (Phases 3c–3d)

## Overview
Implements the custom resource builder and the shared review/submit flow: select resources → configure → `/review` → submit → proof modal. Requires Phase Core to be complete. Covers ResourceCatalog, ResourceDrawer, SelectedPanel, ReviewSection, SubmitButton, and ConfirmModal.

## Scope — Files to Create or Modify

### Builder (Phase 3c)
- `web/app/builder/page.tsx` — `/builder` route
- `web/components/builder/ResourceCatalog.tsx` — browsable grid of resource types from `data/resources.json`
- `web/components/builder/ResourceDrawer.tsx` — slide-in config drawer, Escape to close, fields via `buildSchema`, validated with Zod
- `web/components/builder/SelectedPanel.tsx` — list of added resources with remove buttons

### Review + Submit (Phase 3d)
- `web/app/review/page.tsx` — `/review` route; redirects to `/` if store is empty
- `web/components/review/ReviewSection.tsx` — displays template payload or custom resources correctly for both modes; includes submit button that calls `submitDeployment` from `lib/api.ts`, shows spinner during submission, disables while loading
- `web/components/review/ConfirmModal.tsx` — `role="dialog"`, `aria-modal`, Escape to close; shows 3-step status timeline (accepted → running → succeeded/failed) and copyable proof text from `generateReport`; on succeeded shows "View in Azure Portal" deep-link to resource group in `sub-epf-sandbox-internal`

## Acceptance Criteria
- `/builder` shows all resource types; adding a resource type twice is blocked (store rejects duplicate types)
- ResourceDrawer slides in from right; config fields are validated with Zod before adding to store
- SelectedPanel shows all added resources with working remove buttons
- `/review` redirects to `/` if `deploymentStore` is empty
- ReviewSection renders correctly for both template-mode and custom-mode payloads; uses `displayFieldValue` for all form values
- SubmitButton shows spinner during submission and is disabled while loading
- ConfirmModal shows 3-step timeline: `accepted` (submitted), `running` (deploying), `succeeded`/`failed` (complete)
- ConfirmModal proof text matches CLAUDE.md §Proof Artifact Format; copy button writes text to clipboard
- On `succeeded`, "View in Azure Portal" deep-link to the resource group in `sub-epf-sandbox-internal` is shown
- Both flows (template + custom) complete end-to-end without errors
- Status polling: `GET /api/deployments/:id?rg=<rgName>` every 3 seconds until terminal state

## Quality Gates

```bash
cd web
npm run lint
npx vitest run
npm run build
```

Then run the smoke test checklist (`/smoke`) to verify both flows end-to-end.

## Reference
- Resource data shape: `web/data/resources.json`
- Error response contract: CLAUDE.md §Error Response Contract
- Proof artifact format: CLAUDE.md §Proof Artifact Format
- API client: `web/lib/api.ts` (`submitDeployment`)
- Report generator: `web/lib/report.ts` (`generateReport`)
- Status mapping: `web/lib/deployments/arm-status.ts` (`mapArmProvisioningState`)
