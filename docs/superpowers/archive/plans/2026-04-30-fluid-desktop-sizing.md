# Fluid Desktop Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tier-based responsive widths (`lg:max-w-3xl xl:max-w-4xl`) on the three narrow pages/components with viewport-fluid `clamp()` sizing so the UI scales smoothly with desktop width instead of jumping at breakpoints.

**Architecture:** Use Tailwind v4 arbitrary values with CSS `clamp(min, preferred, max)`. Each container gets a single `max-w-[clamp(...)]` utility. The modal additionally gets an inner content wrapper that caps its children to a readable width, preventing buttons and form rows from stretching awkwardly inside a wide modal shell.

**Tech Stack:** Tailwind CSS v4, Next.js 16, TypeScript

**Scope:** Three files only — `Modal.tsx`, `review/page.tsx`, `my-stuff/page.tsx`. The previously-applied tier-based `lg:`/`xl:` widths are replaced, not stacked on top of.

---

## Risk Analysis

| # | Risk | Likelihood | Mitigation |
|---|------|-----------|------------|
| 1 | Tests assert on `max-w-*` class names | **None** — audited, no matches in `__tests__/` | n/a |
| 2 | Other components import `Modal.tsx` | **None** — only `ConfirmModal` consumes it | n/a |
| 3 | Buttons (`w-full`) and inputs stretch to ugly widths inside wider modal | High if unmitigated | Add `mx-auto max-w-xl` wrapper inside modal body (Task 4) |
| 4 | Long text lines become hard to read on wide screens | Low — review page text is mostly form labels and short paragraphs | Form fields already use `grid-cols-1 sm:grid-cols-2`; no body prose to worry about |
| 5 | Visual regression at intermediate viewport sizes (1100, 1400, 1700px) | Medium — clamp scaling is smooth but content may reflow unexpectedly | Manual verification at 5 viewport sizes (Task 6) |
| 6 | Tailwind v4 arbitrary-value bundle bloat | Negligible — 3 unique `clamp()` expressions add <1 KB | n/a |
| 7 | `clamp()` browser support | None — all evergreen browsers since 2020 | n/a |
| 8 | Proof `<pre>` lines wrap differently in wider container | Low — proof has its own `max-h-64 overflow-auto`, lines are short and monospaced | Visually verify (Task 6) |
| 9 | My Stuff table columns redistribute oddly when growing 768→1280px | Medium | Visually verify (Task 6) — table uses fluid `<table>` layout, should be fine |
| 10 | Two responsive systems (existing tier + new fluid) coexist and confuse future devs | Low | This plan removes the tier values it replaces, leaving a single source of truth per element |

**Net risk:** Low. The only realistic failure mode is item #5 (visual regression at intermediate sizes), addressed by the manual verification step.

---

## Clamp ranges chosen

Picked so the small-screen behaviour is unchanged from the *original* (pre-tier) state, and the upper cap stays within readable line-length norms.

| Element | Formula | min (px) | max (px) | At 1280vw | At 1920vw |
|---|---|---|---|---|---|
| Modal | `clamp(32rem, 70vw, 56rem)` | 512 | 896 | 896 (capped) | 896 (capped) |
| Review page | `clamp(42rem, 60vw, 56rem)` | 672 | 896 | 768 | 896 (capped) |
| My Stuff page | `clamp(48rem, 80vw, 80rem)` | 768 | 1280 | 1024 | 1280 (capped) |

Modal stays narrower than the review page underneath it so it reads as an overlay, not a takeover.

---

> **Note on TDD:** This is pure CSS class replacement with no logic. Verification uses lint, type-check, full test suite, build smoke test, and manual viewport check.

---

### Task 1: Replace Modal width

**Files:**
- Modify: `web/components/ui/Modal.tsx:90`

- [ ] **Step 1: Replace the tier-based modal width with clamp()**

In `web/components/ui/Modal.tsx`, find the line:

```tsx
            className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col rounded-xl border border-border bg-surface-elevated shadow-2xl sm:max-h-[calc(100dvh-3rem)] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
```

Replace it with:

```tsx
            className="relative z-10 flex max-h-[calc(100dvh-2rem)] w-full max-w-[clamp(32rem,70vw,56rem)] flex-col rounded-xl border border-border bg-surface-elevated shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
```

The `max-w-lg`, `md:max-w-2xl`, `lg:max-w-3xl`, `xl:max-w-4xl` are replaced by the single `max-w-[clamp(32rem,70vw,56rem)]`. The `w-full` stays because clamp's min would otherwise leave a gap below 512px viewport — `w-full` lets the modal shrink on tiny screens.

- [ ] **Step 2: Verify type-check**

Run from `web/`:
```bash
npx tsc --noEmit
```
Expected: `0 errors`

- [ ] **Step 3: Commit**

```bash
git add web/components/ui/Modal.tsx
git commit -m "feat(modal): fluid width with clamp instead of tier breakpoints"
```

---

### Task 2: Replace Review page width

**Files:**
- Modify: `web/app/review/page.tsx:149`

- [ ] **Step 1: Replace the review page container width**

In `web/app/review/page.tsx`, find the line:

```tsx
    <div className="mx-auto max-w-2xl px-6 md:px-8 py-8 md:py-12 lg:max-w-3xl xl:max-w-4xl">
```

Replace it with:

```tsx
    <div className="mx-auto max-w-[clamp(42rem,60vw,56rem)] px-6 md:px-8 py-8 md:py-12">
```

- [ ] **Step 2: Verify type-check**

Run from `web/`:
```bash
npx tsc --noEmit
```
Expected: `0 errors`

- [ ] **Step 3: Commit**

```bash
git add web/app/review/page.tsx
git commit -m "feat(review): fluid container width with clamp"
```

---

### Task 3: Replace My Stuff page width

**Files:**
- Modify: `web/app/my-stuff/page.tsx:50`

- [ ] **Step 1: Replace the my-stuff page container width**

In `web/app/my-stuff/page.tsx`, find the line:

```tsx
      <div className="mx-auto max-w-3xl px-6 py-8 md:px-8 md:py-12 lg:max-w-5xl xl:max-w-6xl">
```

Replace it with:

```tsx
      <div className="mx-auto max-w-[clamp(48rem,80vw,80rem)] px-6 py-8 md:px-8 md:py-12">
```

- [ ] **Step 2: Verify type-check**

Run from `web/`:
```bash
npx tsc --noEmit
```
Expected: `0 errors`

- [ ] **Step 3: Commit**

```bash
git add web/app/my-stuff/page.tsx
git commit -m "feat(my-stuff): fluid container width with clamp"
```

---

### Task 4: Constrain modal inner content

**Files:**
- Modify: `web/components/review/ConfirmModal.tsx:159`

This prevents `w-full` buttons and the proof `<pre>` from stretching to the full ~896px modal width on big screens. Caps inner content at 36rem (576px), centered.

- [ ] **Step 1: Wrap the modal body content**

In `web/components/review/ConfirmModal.tsx`, find the line:

```tsx
      <div className="space-y-4">
```

Replace it with:

```tsx
      <div className="mx-auto max-w-xl space-y-4">
```

The closing `</div>` stays unchanged.

- [ ] **Step 2: Verify type-check**

Run from `web/`:
```bash
npx tsc --noEmit
```
Expected: `0 errors`

- [ ] **Step 3: Commit**

```bash
git add web/components/review/ConfirmModal.tsx
git commit -m "feat(modal): cap inner content width so buttons don't stretch"
```

---

### Task 5: Quality gates

- [ ] **Step 1: Lint**

Run from `web/`:
```bash
npm run lint
```
Expected: `0 errors` (1 pre-existing warning in `proxy.ts` is acceptable)

- [ ] **Step 2: Full test suite**

Run from `web/`:
```bash
npx vitest run
```
Expected: `Test Files 33 passed (33)`, `Tests 206 passed (206)`

- [ ] **Step 3: Production build**

Run from `web/`:
```bash
AZURE_SUBSCRIPTION_ID=x AZURE_TENANT_ID=x AZURE_STORAGE_CONNECTION_STRING=x SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx npm run build
```
Expected: build completes, `.next/` produced, no errors

If any of the above fails, **STOP**. Do not proceed to Task 6. Investigate and fix before continuing.

---

### Task 6: Manual viewport verification

**Goal:** Confirm visual integrity at the boundaries and middle of each clamp range. Do not skip — clamp scaling can produce subtle reflow issues that lint/types can't catch.

- [ ] **Step 1: Start dev server**

Run from `web/`:
```bash
$env:NODE_OPTIONS="--use-system-ca"; npm run dev
```
Wait for `Ready` message at `http://localhost:3000`.

- [ ] **Step 2: Visit each affected route at 5 viewport sizes**

Open browser DevTools → Toolbar → Responsive mode. For each viewport width below, visit each route and confirm:
- No horizontal scrollbar appears
- Content stays centered
- No element is clipped, overlapping, or oddly stretched
- Modal opens and is scrollable end-to-end

Viewports to test: **1024**, **1280**, **1440**, **1920**, **2560**.

Routes:
- `/review` (will redirect to `/` without state — instead test by going through a template flow first, e.g. `/templates/storage-account` → fill form → continue → submit → modal opens)
- `/my-stuff`

- [ ] **Step 3: Report findings**

If any issue found, document the viewport size and route in a follow-up note. Do not commit fixes blindly — surface the issue first.

If all 5 sizes look correct on both routes, proceed.

- [ ] **Step 4: Stop dev server**

`Ctrl+C` in the terminal.

---

### Task 7: Archive plan

- [ ] **Step 1: Move plan to archive**

```bash
mv docs/superpowers/plans/2026-04-30-fluid-desktop-sizing.md docs/superpowers/archive/plans/
git add docs/superpowers/plans/2026-04-30-fluid-desktop-sizing.md docs/superpowers/archive/plans/2026-04-30-fluid-desktop-sizing.md
git commit -m "chore: archive fluid desktop sizing plan"
```

---

## Rollback

Each task is a single commit. If any task introduces a regression discovered later:

```bash
git revert <commit-sha>
```

The four feature commits (Tasks 1–4) are independent of each other in the sense that any one can be reverted without breaking the others — though reverting Task 4 alone would leave buttons stretching inside a wide modal, so revert Tasks 1 and 4 together if you want to undo the modal change cleanly.
