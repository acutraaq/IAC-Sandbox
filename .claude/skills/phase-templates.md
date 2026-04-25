---
name: phase-templates
description: Template catalog + wizard flow (Phase 3b): TemplateGrid, FilterPills, TemplateCard, Stepper, WizardStep, SummaryPanel
---

# Phase: Template Flow (Phase 3b)

## Overview
Implements the template selection and wizard flow: catalog → pick template → multi-step wizard → `/review`. Requires Phase Core to be complete. Covers TemplateGrid, FilterPills, TemplateCard, Stepper, WizardStep, and SummaryPanel.

## Scope — Files to Create or Modify

- `web/app/templates/page.tsx` — `/templates` route: renders TemplateGrid with FilterPills
- `web/app/templates/[slug]/page.tsx` — `/templates/[slug]` route: renders wizard Stepper
- `web/components/templates/TemplateGrid.tsx` — grid of TemplateCards
- `web/components/templates/FilterPills.tsx` — category filter buttons ("All" + per-category)
- `web/components/templates/TemplateCard.tsx` — single template card with hover lift, keyboard-activatable; policy-blocked templates show lock UI
- `web/components/wizard/Stepper.tsx` — step progress indicator (current/completed/upcoming states)
- `web/components/wizard/WizardStep.tsx` — single step: title, form fields via `buildSchema`, Next/Back buttons
- `web/components/wizard/SummaryPanel.tsx` — right-side live preview of filled values using `displayFieldValue`

## Acceptance Criteria
- `/templates` renders all 16 templates from `data/templates.json` across 6 categories
- FilterPills filter by category; "All" resets to show all 16
- Policy-blocked templates (e.g. `virtual-machine`) show a lock indicator and do not navigate to wizard
- Clicking a non-blocked TemplateCard navigates to `/templates/[slug]`
- Wizard shows the correct number of steps for the selected template
- Stepper shows current/completed/upcoming states correctly
- SummaryPanel updates live as form fields are filled
- Final wizard step writes the normalized payload to `deploymentStore` and navigates to `/review`
- All template cards are keyboard-activatable (Enter/Space); Stepper steps have `aria-current`
- No `any` types; all cross-route state in `deploymentStore`
- Region options limited to: Malaysia West (`malaysiasouth`), Southeast Asia (`southeastasia`), East Asia (`eastasia`)

## Quality Gates

```bash
cd web
npm run lint
npx vitest run
npm run build
```

## Reference
- Template data shape: `web/data/templates.json`
- Store actions: `web/store/deploymentStore.ts`
- Field schema utility: `web/lib/schema.ts` (`buildSchema`)
- Icon utility: `web/lib/icons.ts` (`getIcon`)
- Display utility: `web/lib/display.ts` (`displayFieldValue`)
- Policy allow-list: `web/lib/deployments/policy.ts` (`DEPLOYABLE_SLUGS`)
