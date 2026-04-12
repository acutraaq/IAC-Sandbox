---
name: phase-templates
description: Template catalog + wizard flow (Phase 3b): TemplateGrid, FilterPills, TemplateCard, Stepper, WizardStep, SummaryPanel
---

# Phase: Template Flow (Phase 3b)

Implement the template selection and wizard flow. Users browse templates, pick one, fill in a multi-step wizard, and land at `/review`.

## Scope — Files to Create or Modify

- `frontend/app/templates/page.tsx` — `/templates` route: renders TemplateGrid with FilterPills
- `frontend/app/templates/[slug]/page.tsx` — `/templates/[slug]` route: renders wizard Stepper
- `frontend/components/templates/TemplateGrid.tsx` — grid of TemplateCards
- `frontend/components/templates/FilterPills.tsx` — category filter buttons ("All" + per-category)
- `frontend/components/templates/TemplateCard.tsx` — single template card with hover lift, keyboard-activatable
- `frontend/components/wizard/Stepper.tsx` — step progress indicator (current/completed/upcoming states)
- `frontend/components/wizard/WizardStep.tsx` — single step: title, form fields via `buildSchema`, Next/Back buttons
- `frontend/components/wizard/SummaryPanel.tsx` — right-side live preview of filled values

## Acceptance Criteria
- `/templates` renders all 8 templates from `data/templates.json`
- FilterPills filter by category; "All" resets to show all
- Clicking a TemplateCard navigates to `/templates/[slug]`
- Wizard shows the correct number of steps for the selected template
- Stepper shows current/completed/upcoming states correctly
- SummaryPanel updates live as form fields are filled
- Final wizard step writes the normalized payload to `deploymentStore` and navigates to `/review`
- All template cards are keyboard-activatable (Enter/Space); Stepper steps have `aria-current`
- No `any` types; all cross-route state in `deploymentStore`

## Quality Gates

```
cd frontend
npm run lint
npm run test:run
npm run build
```

## Reference
- Template data shape: `frontend/data/templates.json`
- Store actions: `frontend/store/deploymentStore.ts`
- Field schema utility: `frontend/lib/schema.ts` (`buildSchema`)
- Icon utility: `frontend/lib/icons.ts` (`getIcon`)
