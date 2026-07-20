# Design: Richer Per-Step Detail in the Learn Tab

> **Date:** 2026-07-20 | **Status:** Draft — pending user review | **Author:** Claude (session)

## Purpose

The Learn tab (`web/app/learn/page.tsx`, shipped per `docs/superpowers/specs/2026-07-17-powerapps-learn-catalog-design.md`) currently renders each step as a title + one-line detail. The user wants each step to guide them more thoroughly without changing the page's interaction model — all steps stay visible at once in the existing static list (no accordion, no one-step-at-a-time navigation).

## Non-goals

- No change to navigation model — steps remain a flat, always-visible ordered list (`StepWalkthrough.tsx`), not a click-to-reveal or wizard-style flow.
- No screenshots/images — no real product screenshots exist for these flows; the existing topic-level "learn more" link (to the official Microsoft Learn article) remains the way to reach real UI screenshots.
- No new page, route, or component file beyond extending what already exists.
- No changes to `functions/`, ARM, deployment code, or any other part of the app — this is content-only within the Learn tab.

## Data model change

Extend `LearnStep` in `web/data/learn-content.ts` with three optional fields:

```ts
export interface LearnStep {
  title: string;
  detail: string;
  subSteps?: string[];
  expectedResult?: string;
  pitfall?: string;
}
```

All three are optional so any step can omit a field that doesn't apply (e.g. a simple "click Publish" step may not need sub-steps).

## Content

All 5 topics (canvas apps, model-driven apps, Power Apps vibe, Copilot Studio, Copilot agents) get `subSteps`, `expectedResult`, and `pitfall` filled in per step, sourced from the same Microsoft Learn pages already referenced via each topic's `learnMoreUrl`. Not every step will need every field — fields are added where they add real value (e.g. a pitfall is only written where a genuine common mistake exists), not padded to satisfy a quota.

## Component change

`web/components/learn/StepWalkthrough.tsx` renders the new fields conditionally, in this order under the existing title/detail:

1. **Sub-steps** — nested ordered list (`<ol type="a">`) directly under `detail`, same text sizing as `detail` but indented.
2. **Expected result** — single muted line prefixed "You should see:" so the user can confirm the step worked before moving on.
3. **Pitfall** — single line in the same warning-tinted visual language `GuideSection.tsx` already uses for topic-level callouts (`border-warning/25 bg-warning/10`), scoped to just this step instead of the whole topic.

No new components — this is additive rendering inside the existing `<li>` per step.

## Testing

Extend the existing `StepWalkthrough` test coverage (or `GuideSection.test.tsx`, whichever currently covers step rendering) to assert: a step with all three optional fields renders sub-steps, expected result, and pitfall; a step omitting them renders cleanly with no empty sections. No new test files.

## Housekeeping note (unrelated to this change)

`docs/superpowers/specs/2026-07-17-powerapps-learn-catalog-design.md` is still marked "Draft — pending user review" and sitting in the active `specs/` folder, even though the Learn tab it describes has already shipped and matches that spec exactly. It should be moved to `docs/superpowers/archive/specs/` as a follow-up — not done as part of this change to stay scoped to the step-detail work.
