---
name: phase-builder-review
description: Custom builder + review/submit flow (Phases 3c–3d): ResourceCatalog, ResourceDrawer, SelectedPanel, ReviewSection, SubmitButton, ConfirmModal, proof artifact
---

# Phase: Builder + Review/Submit (Phases 3c–3d)

## Overview
Implements the custom resource builder and the shared review/submit flow: select resources → configure → `/review` → submit → proof modal. Requires Phase Core to be complete. Covers ResourceCatalog, ResourceDrawer, SelectedPanel, ReviewSection, SubmitButton, and ConfirmModal.

## Scope — Files to Create or Modify

### Builder (Phase 3c)
- `frontend/app/builder/page.tsx` — `/builder` route
- `frontend/components/builder/ResourceCatalog.tsx` — browsable grid of 8 resource types from `data/resources.json`
- `frontend/components/builder/ResourceDrawer.tsx` — slide-in config drawer, Escape to close, fields via `buildSchema`, validated with Zod
- `frontend/components/builder/SelectedPanel.tsx` — list of added resources with remove buttons

### Review + Submit (Phase 3d)
- `frontend/app/review/page.tsx` — `/review` route; redirects to `/` if store is empty
- `frontend/components/review/ReviewSection.tsx` — displays template payload or custom resources correctly for both modes
- `frontend/components/review/SubmitButton.tsx` — calls `submitDeployment` from `lib/api.ts`, shows spinner during submission, disables while loading
- `frontend/components/review/ConfirmModal.tsx` — `role="dialog"`, `aria-modal`, Escape to close; shows copyable proof text from `generateReport`
- `frontend/mocks/handlers.ts` — MSW handler for `POST /deployments`: returns `{ submissionId, status: 'accepted' }` on success; returns standard error shape on error

## Acceptance Criteria
- `/builder` shows all 8 resource types; adding a resource type twice is blocked (store rejects duplicate types)
- ResourceDrawer slides in from right; config fields are validated with Zod before adding to store
- SelectedPanel shows all added resources with working remove buttons
- `/review` redirects to `/` if `deploymentStore` is empty
- ReviewSection renders correctly for both template-mode and custom-mode payloads
- SubmitButton shows spinner during submission and is disabled while loading
- MSW success response: `{ submissionId: 'sub_...', status: 'accepted' }`
- MSW error response matches CLAUDE.md §Error Response Contract: `{ error: { code, message, details }, requestId }`
- ConfirmModal shows proof text matching CLAUDE.md §Proof Artifact Format; copy button writes text to clipboard
- Both flows (template + custom) complete end-to-end without errors

## Quality Gates

```
cd frontend
npm run lint
npm run test:run
npm run build
```

Then run the smoke test checklist (`/smoke`) to verify both flows end-to-end.

## Reference
- Resource data shape: `frontend/data/resources.json`
- Error response contract: CLAUDE.md §Error Response Contract
- Proof artifact format: CLAUDE.md §Proof Artifact Format
- API client: `frontend/lib/api.ts` (`submitDeployment`)
- Report generator: `frontend/lib/report.ts` (`generateReport`)
