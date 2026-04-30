# Dark-Only Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove light mode entirely and harden the dark palette to the "Lighter Dark" (option C) colour set.

**Architecture:** All colour tokens move to a single `:root` block in `globals.css`. The `ThemeToggle` component and its `data-theme` attribute wiring are deleted. No component class names change — everything already consumes CSS variables.

**Tech Stack:** Next.js 16, Tailwind CSS v4, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-30-dark-only-theme-design.md`

---

> **Note on TDD:** This change has no logic to unit-test — it is purely CSS token replacement and component deletion. Verification steps use lint, type-check, and a build smoke test instead of unit tests.

---

### Task 1: Replace theme tokens in globals.css

**Files:**
- Modify: `web/app/globals.css:1-37`

- [ ] **Step 1: Replace the two-block theme system with a single `:root` block**

Open `web/app/globals.css`. Replace lines 1–37 (the `/* ── Light theme ── */` `:root` block and the `/* ── Dark theme ── */` `html[data-theme="dark"]` block) with:

```css
@import "tailwindcss";

/* ── Theme tokens ── */
:root {
  --color-bg: #22324a;
  --color-surface: #2c4262;
  --color-surface-elevated: #375577;
  --color-border: rgba(44, 127, 212, 0.25);
  --color-border-strong: rgba(44, 127, 212, 0.40);
  --color-text: #e0eaf8;
  --color-text-muted: rgba(175, 210, 245, 0.82);
  --color-primary: #2b7fd4;
  --color-primary-hover: #3a8ee3;
  --color-accent: #4a9be0;
  --color-accent-hover: #5aaef0;
  --color-error: #ef4444;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
}
```

Everything from line 38 onwards (`/* ── Tailwind v4 theme tokens ── */` and below) is unchanged.

- [ ] **Step 2: Verify lint passes**

Run from `web/`:
```bash
npm run lint
```
Expected: `0 errors, 0 warnings`

- [ ] **Step 3: Commit**

```bash
git add web/app/globals.css
git commit -m "feat: switch to dark-only theme tokens (palette C)"
```

---

### Task 2: Remove ThemeToggle from Navbar

**Files:**
- Modify: `web/components/layout/Navbar.tsx:9,84`

- [ ] **Step 1: Remove the import**

In `web/components/layout/Navbar.tsx`, delete line 9:
```ts
import { ThemeToggle } from "./ThemeToggle";
```

- [ ] **Step 2: Remove the JSX usage**

In the same file, delete line 84 (now shifted by -1 after the import removal):
```tsx
          <ThemeToggle />
```

The surrounding context that should remain is:
```tsx
        {/* Right: toggle + avatar + mobile button */}
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} />
```

- [ ] **Step 3: Run type-check**

Run from `web/`:
```bash
npx tsc --noEmit
```
Expected: `0 errors`

- [ ] **Step 4: Commit**

```bash
git add web/components/layout/Navbar.tsx
git commit -m "feat: remove ThemeToggle from Navbar"
```

---

### Task 3: Delete ThemeToggle.tsx

**Files:**
- Delete: `web/components/layout/ThemeToggle.tsx`

- [ ] **Step 1: Delete the file**

```bash
rm web/components/layout/ThemeToggle.tsx
```

- [ ] **Step 2: Verify no remaining references**

```bash
grep -r "ThemeToggle" web/
```
Expected: no output (zero matches)

- [ ] **Step 3: Run type-check and lint**

Run from `web/`:
```bash
npx tsc --noEmit && npm run lint
```
Expected: `0 errors` on both

- [ ] **Step 4: Commit**

```bash
git add -u web/components/layout/ThemeToggle.tsx
git commit -m "feat: delete ThemeToggle component"
```

---

### Task 4: Remove suppressHydrationWarning from layout.tsx

**Files:**
- Modify: `web/app/layout.tsx:38`

- [ ] **Step 1: Remove the attribute**

In `web/app/layout.tsx`, find the `<html>` opening tag (line 38):
```tsx
      <html
        lang="en"
        suppressHydrationWarning
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
      >
```

Replace with:
```tsx
      <html
        lang="en"
        className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
      >
```

- [ ] **Step 2: Run type-check**

Run from `web/`:
```bash
npx tsc --noEmit
```
Expected: `0 errors`

- [ ] **Step 3: Commit**

```bash
git add web/app/layout.tsx
git commit -m "feat: remove suppressHydrationWarning (no theme toggle)"
```

---

### Task 5: Update CLAUDE.md design system section

**Files:**
- Modify: `CLAUDE.md:386-421`

- [ ] **Step 1: Replace the design system intro and both token tables**

In `CLAUDE.md`, replace the block from line 386 to 421 (the `## Design System` heading through the end of the dark token table) with:

```markdown
## Design System

> Font: IBM Plex Sans + IBM Plex Mono. Dark-only — single `:root` token set, no theme toggle.

### Color Tokens
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#22324a` | Page background |
| `--color-surface` | `#2c4262` | Card backgrounds |
| `--color-surface-elevated` | `#375577` | Modals, popovers |
| `--color-border` | `rgba(44, 127, 212, 0.25)` | Borders |
| `--color-border-strong` | `rgba(44, 127, 212, 0.40)` | Strong borders |
| `--color-text` | `#e0eaf8` | Primary text |
| `--color-text-muted` | `rgba(175, 210, 245, 0.82)` | Secondary text |
| `--color-primary` | `#2b7fd4` | Buttons, active states |
| `--color-primary-hover` | `#3a8ee3` | Primary hover |
| `--color-accent` | `#4a9be0` | Links, highlights (Azure blue) |
| `--color-accent-hover` | `#5aaef0` | Accent hover |
| `--color-error` | `#ef4444` | Errors |
| `--color-success` | `#22c55e` | Success |
| `--color-warning` | `#f59e0b` | Warnings |
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md design system to dark-only tokens"
```

---

### Task 6: Quality gates

- [ ] **Step 1: Run full test suite**

Run from `web/`:
```bash
npx vitest run
```
Expected: all tests pass

- [ ] **Step 2: Run production build**

Run from `web/` (dummy env vars required):
```bash
AZURE_SUBSCRIPTION_ID=x AZURE_TENANT_ID=x AZURE_STORAGE_CONNECTION_STRING=x SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx npm run build
```
Expected: build completes, `.next/` produced, no errors

- [ ] **Step 3: Archive the spec**

```bash
mv docs/superpowers/specs/2026-04-30-dark-only-theme-design.md docs/superpowers/archive/specs/
git add docs/superpowers/specs/2026-04-30-dark-only-theme-design.md docs/superpowers/archive/specs/2026-04-30-dark-only-theme-design.md
git commit -m "chore: archive dark-only theme spec"
```
