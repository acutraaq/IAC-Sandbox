# Plan — Terminal-Native Document Redesign

**Owner:** sonnet executor | **Planner:** opus | **Date:** 2026-05-13
**Status:** Ready to execute
**Scope:** Frontend visual redesign only. No API/data/auth changes.
**Reference inspiration:** github-codespaces marketing aesthetic (editorial mono, oversized type, deep navy, document framing).

## Aesthetic North Star

The site reads as a typeset technical document with terminal-style chrome. Mono is the visual register for navigation, headers, IDs, status; sans is the register for body copy, button labels, and form copy. Users still click — they never type. Terminal aesthetic is wrapper, not literal CLI.

## Locked decisions (confirmed by user)

1. Mono Boundary widened to nav chrome + section headers. Document the exception in DESIGN.md.
2. Line-number gutter on **home + templates only**.
3. Login: full terminal panel.

## Hard constraints — DO NOT VIOLATE

- No gradient text (`background-clip: text`)
- No glassmorphism beyond existing scrolled-navbar backdrop-blur
- No side-stripe colored borders (`border-left > 1px` accent)
- No new neon/cyberpunk colors — palette must stay within existing tokens + the two new tokens defined below
- No typing animations / fake CLI (would mislead non-technical users)
- No `output: 'standalone'` change, no Next config change
- No route changes, no API contract changes
- No MSAL activation
- Wizard forms, builder forms, tag inputs, button labels: **keep current copy and sans font** — non-technical users must still understand every action

## Quality gates (must pass before claiming done)

Run from `web/`:
```
npm run lint        # 0 errors
npx tsc --noEmit    # 0 errors
npx vitest run      # all pass
npm run build       # .next/ produced
```

Existing tests that may need updating:
- `web/__tests__/components/layout/Breadcrumb.test.tsx` — keep Breadcrumb component working; if you replace Breadcrumb usage with PageEyebrow on some pages, leave the Breadcrumb component intact and its test green.

---

## Step 1 — Token additions

### File: `web/app/globals.css`

Add inside `:root`:
```css
--color-prompt: #5aaef0;
--color-comment: rgba(175, 210, 245, 0.50);
```

Add inside `@theme inline`:
```css
--color-prompt: var(--color-prompt);
--color-comment: var(--color-comment);
```

Add new utility at bottom of the file:
```css
/* Line-number gutter — used on home + templates pages only */
.line-gutter {
  position: relative;
}
.line-gutter::before {
  content: "01\A 02\A 03\A 04\A 05\A 06\A 07\A 08\A 09\A 10\A 11\A 12\A 13\A 14\A 15\A 16\A 17\A 18\A 19\A 20\A 21\A 22\A 23\A 24\A 25\A 26\A 27\A 28\A 29\A 30\A 31\A 32\A 33\A 34\A 35\A 36\A 37\A 38\A 39\A 40";
  position: fixed;
  top: 5rem;
  left: 1rem;
  white-space: pre;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 28px;
  color: var(--color-text-faint);
  opacity: 0.18;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}
@media (max-width: 768px) {
  .line-gutter::before { display: none; }
}
```

Body type unchanged. No font weight changes.

### File: `DESIGN.md`

Append a section under "Typography" titled:

```markdown
### Mono Boundary — Documented Exception

The Mono Boundary Rule (IBM Plex Mono = machine-generated strings only) is widened to also include navigation chrome and section headers in the Terminal-Native Document treatment:

- The `~/path` page eyebrow (top-of-page route indicator)
- Section headers prefixed with `##` (e.g., `## popular-templates`)
- Navbar wordmark (`~/sandbox`)
- Footer single-line meta

Body copy, button labels, form labels, error messages, and toast text remain IBM Plex Sans. This exception is intentional and bounded — do not extend mono further without revising this section.
```

### File: `.claude/rules/design-system.md`

Append the same Mono Boundary exception paragraph at the end of the Typography table section so the rule auto-loads when editing `web/**`.

---

## Step 2 — New components

### File: `web/components/layout/PageEyebrow.tsx` (NEW)

```tsx
"use client";

interface PageEyebrowProps {
  path: string; // e.g. "templates", "templates/web-application"
  className?: string;
}

export function PageEyebrow({ path, className = "" }: PageEyebrowProps) {
  return (
    <div
      className={`mb-3 font-mono text-xs text-text-muted tracking-[0.05em] ${className}`}
      aria-hidden="true"
    >
      <span className="text-prompt">~/</span>
      {path}
    </div>
  );
}
```

Note: `text-prompt` requires tailwind to map `--color-prompt`. Tailwind v4 auto-generates from `@theme inline` tokens, so `text-prompt` works once globals.css is updated.

### File: `web/components/ui/MonoSectionHeader.tsx` (NEW)

```tsx
interface MonoSectionHeaderProps {
  title: string;          // rendered as: ## {title}
  description?: string;   // sans, muted, below
  rightSlot?: React.ReactNode;
}

export function MonoSectionHeader({ title, description, rightSlot }: MonoSectionHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="font-mono text-base font-medium text-text">
          <span className="text-text-faint">## </span>
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-[65ch] text-sm text-text-muted">{description}</p>
        )}
      </div>
      {rightSlot}
    </div>
  );
}
```

### File: `web/components/ui/DocumentDivider.tsx` (NEW)

```tsx
interface DocumentDividerProps {
  label?: string; // optional inline mono label
  className?: string;
}

export function DocumentDivider({ label, className = "" }: DocumentDividerProps) {
  return (
    <div className={`my-6 flex items-center gap-3 ${className}`} role="separator">
      <span className="font-mono text-xs text-text-faint">---</span>
      {label && (
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-text-faint">
          {label}
        </span>
      )}
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
```

### File: `web/components/templates/TemplateRow.tsx` (NEW)

```tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { Template } from "@/types";

interface TemplateRowProps {
  template: Template;
  index: number; // 1-based, formatted as 01..16
}

const categoryLabels: Record<string, string> = {
  compute: "compute",
  data: "data",
  network: "network",
  security: "security",
  "landing-zone": "landing-zone",
  automation: "automation",
  integration: "integration",
};

export function TemplateRow({ template, index }: TemplateRowProps) {
  const num = String(index).padStart(2, "0");
  const cat = categoryLabels[template.category] ?? template.category;

  return (
    <Link
      href={`/templates/${template.slug}`}
      className="group grid grid-cols-[2.5rem_auto_1fr_auto] items-center gap-x-4 gap-y-1 border-b border-border px-2 py-4 transition-colors hover:bg-surface-elevated/60 sm:grid-cols-[2.5rem_14rem_1fr_8rem_2rem]"
    >
      <span className="font-mono text-xs text-text-faint">{num}</span>

      <span className="font-mono text-xs text-prompt">
        {cat}/{template.slug}
      </span>

      <div className="col-span-2 sm:col-span-1">
        <p className="text-sm font-semibold text-text">{template.name}</p>
        <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">
          {template.description}
        </p>
      </div>

      <span className="hidden text-[11px] uppercase tracking-[0.075em] font-semibold text-text-muted sm:inline">
        {template.resourceCount} res · {template.estimatedTime}
      </span>

      <span className="hidden justify-self-end opacity-0 transition-opacity group-hover:opacity-100 sm:inline">
        <ArrowRight className="h-4 w-4 text-accent" />
      </span>

      <DynamicIcon
        name={template.icon}
        className="hidden h-0 w-0"
        aria-hidden="true"
      />
    </Link>
  );
}
```

Note: keep the `DynamicIcon` import path but render it hidden — preserves icon registry build-time discovery without showing a card icon. If `DynamicIcon` errors on `h-0 w-0`, remove the icon render entirely from this row component; icons are unused in the new editorial row design.

**Recommended simpler version:** delete the icon render entirely (don't import `DynamicIcon` at all). Icons are no longer used in rows.

---

## Step 3 — Modified components

### File: `web/components/layout/Navbar.tsx`

Replace lines 47-54 (Logo + wordmark) with:

```tsx
<Link
  href="/"
  className="flex items-center gap-2 transition-opacity hover:opacity-80"
  aria-label="Sandbox home"
>
  <span className="font-mono text-base font-medium text-text">
    <span className="text-prompt">~/</span>sandbox
  </span>
</Link>
```

Remove the `Logo` import. The Logo component stays in the codebase (unused) — do not delete it; another route may reuse it later.

Active link indicator (line 76): change `bg-primary` to `bg-accent` for stronger visual signal in the mono context. Test snapshot may need update.

### File: `web/components/layout/Footer.tsx`

Replace full body of the component (line 8-23) with:

```tsx
return (
  <footer className="border-t border-border bg-surface/50">
    <div className="mx-auto flex h-14 max-w-7xl items-center px-6 md:px-8">
      <p className="font-mono text-xs text-text-faint">
        <span className="text-comment"># </span>
        v1.0.0 · sub-epf-sandbox-internal · southeastasia
      </p>
    </div>
  </footer>
);
```

### File: `web/components/layout/AmbientBackground.tsx`

No changes. Existing code fragments + corner brackets + curly braces are perfect for this aesthetic. The line-number gutter is delivered separately via the `.line-gutter` utility on home/templates pages.

---

## Step 4 — Page rewrites

### File: `web/app/page.tsx` (home)

Replace the entire body (after imports) with:

```tsx
const popularTemplates = (templatesData as Template[])
  .filter((t) => !t.policyBlocked)
  .slice(0, 4);

export default function Home() {
  return (
    <div className="line-gutter mx-auto max-w-7xl space-y-14 px-6 py-10 md:px-8 md:py-16">
      <PageEyebrow path="" />

      <header>
        <pre
          className="font-mono text-text leading-[1.4] text-[clamp(1.5rem,4vw,2.75rem)] font-medium m-0 whitespace-pre"
          aria-label="Sandbox — Azure IaC for EPF"
        >
{`# ----------------------------------------
# Sandbox — Azure IaC for EPF
# ----------------------------------------`}
        </pre>
        <p className="mt-6 max-w-[65ch] text-base text-text-muted md:text-lg">
          Deploy Azure resources in minutes. Pick a template, build your own
          setup, or request a custom configuration.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/templates">
              Browse Templates
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <NavLink href="/builder" mode="custom" variant="secondary" size="lg">
            Build Custom
          </NavLink>
          <NavLink href="/request" mode="custom-request" variant="ghost" size="lg">
            Request Custom Setup
          </NavLink>
        </div>
      </header>

      <DocumentDivider label="popular-templates" />

      <section>
        <MonoSectionHeader
          title="popular-templates"
          description="Quick-start configurations for common workloads."
          rightSlot={
            <Link
              href="/templates"
              className="flex items-center gap-1 font-mono text-xs text-accent hover:text-accent-hover"
            >
              view all
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
        <div className="border-t border-border">
          {popularTemplates.map((t, i) => (
            <TemplateRow key={t.slug} template={t} index={i + 1} />
          ))}
        </div>
      </section>

      <DocumentDivider label="recent-deployments" />

      <section>
        <MonoSectionHeader
          title="recent-deployments"
          description="Your latest Azure resource group deployments."
        />
        <DeployedList />
      </section>
    </div>
  );
}
```

Imports needed at top (replace existing imports block):
```tsx
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { DeployedList } from "@/components/home/DeployedList";
import { NavLink } from "@/components/home/NavLink";
import { TemplateRow } from "@/components/templates/TemplateRow";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { MonoSectionHeader } from "@/components/ui/MonoSectionHeader";
import { DocumentDivider } from "@/components/ui/DocumentDivider";
import { ArrowRight } from "lucide-react";
import templatesData from "@/data/templates.json";
import type { Template } from "@/types";
```

`TemplateGrid` import is removed.

### File: `web/app/templates/page.tsx`

Replace bundles + individual card layouts with TemplateRow lists. Replace breadcrumb with PageEyebrow. Apply `line-gutter` class.

```tsx
"use client";

import Link from "next/link";
import templatesData from "@/data/templates.json";
import { TemplateRow } from "@/components/templates/TemplateRow";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { MonoSectionHeader } from "@/components/ui/MonoSectionHeader";
import { DocumentDivider } from "@/components/ui/DocumentDivider";
import { ArrowRight } from "lucide-react";
import type { Template } from "@/types";

const BUNDLE_SLUGS = [
  "full-stack-web-app",
  "microservices-platform",
  "data-pipeline",
  "secure-api-backend",
];

const bundles = (templatesData as Template[]).filter((t) =>
  BUNDLE_SLUGS.includes(t.slug)
);
const individual = (templatesData as Template[]).filter(
  (t) => !BUNDLE_SLUGS.includes(t.slug)
);

export default function TemplatesPage() {
  return (
    <div className="line-gutter mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
      <PageEyebrow path="templates" />

      <header className="mb-10">
        <h1 className="font-mono text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium text-text">
          <span className="text-text-faint"># </span>
          templates
        </h1>
        <p className="mt-2 max-w-[65ch] text-sm text-text-muted md:text-base">
          Choose from pre-built configurations or start from scratch.
        </p>
      </header>

      <section className="mb-12">
        <MonoSectionHeader
          title="scenario-bundles"
          description="Pre-built multi-resource configurations for common workloads."
        />
        <div className="border-t border-border">
          {bundles.map((t, i) => (
            <TemplateRow key={t.slug} template={t} index={i + 1} />
          ))}
        </div>
      </section>

      <DocumentDivider label="individual-resources" />

      <section>
        <MonoSectionHeader
          title="individual-resources"
          description="Single-resource deployments for targeted infrastructure needs."
        />
        <div className="border-t border-border">
          {individual.map((t, i) => (
            <TemplateRow key={t.slug} template={t} index={i + 1} />
          ))}
        </div>
      </section>

      <section className="mt-14 border-y border-border py-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-sm text-text-muted">
            <span className="text-comment"># </span>
            can&apos;t find what you need? request a custom setup
          </p>
          <Link
            href="/request"
            className="shrink-0 inline-flex items-center gap-2 rounded-full border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-accent transition-all hover:bg-surface-elevated hover:border-accent/30"
          >
            Request a Custom Setup
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
```

Note: `Breadcrumb` import is dropped from this file. Breadcrumb component stays intact in the codebase and is still used by `/review` (kept as-is) and `/templates/[slug]` if present.

### File: `web/app/builder/page.tsx`

Read the file first. Apply minimal changes:
1. Replace any `Breadcrumb` usage at the top with `<PageEyebrow path="builder" />`
2. Replace the H1 with mono treatment: `<h1 className="font-mono text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium text-text"><span className="text-text-faint"># </span>builder</h1>`
3. Wrap the two columns (available / selected) with `<MonoSectionHeader title="available-resources" />` and `<MonoSectionHeader title="selected" />` headers above each column. Do **not** change the column internals — `SelectedPanel`, resource picker, drawer all keep their current sans treatment.

### File: `web/app/review/page.tsx`

Apply changes:
1. Replace `<Breadcrumb …/>` (line 167) with `<PageEyebrow path="review" />`
2. Replace the H1 (line 176) with mono treatment: `<h1 className="font-mono text-[clamp(1.5rem,3vw,2rem)] font-medium text-text"><span className="text-text-faint"># </span>review-your-setup</h1>` and keep the muted sub-paragraph as-is
3. Wrap `<ReviewSection …/>` between two `<DocumentDivider />` calls (label="configuration" above, label="tags" below)
4. Replace the "Resource Group Tags" inline title (line 192) with `<MonoSectionHeader title="resource-group-tags" description="Required by subscription policy. All four tags must be provided." />` — drop the Tag icon. Keep inputs untouched.
5. The submit button container: replace its title-less wrapper with a `<DocumentDivider label="submit" />` above, and keep the existing card + button as-is.

### File: `web/app/my-stuff/page.tsx`

Read first. Apply minimal changes:
1. Replace Breadcrumb with `<PageEyebrow path="my-stuff" />`
2. Replace H1 with mono treatment matching templates page
3. Add a mono summary line above the table: `<p className="font-mono text-xs text-text-muted mb-4"><span className="text-comment"># </span>filtered by deployedBy=demo@sandbox.local</p>` — use the live user email if available

### File: `web/app/login/page.tsx`

Replace entire body with full terminal panel:

```tsx
import { Suspense } from "react";
import { LoginButton } from "./LoginButton";

export default function LoginPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md">
        <pre
          className="font-mono text-sm text-text-muted leading-relaxed whitespace-pre-wrap"
          aria-hidden="true"
        >
{`# ----------------------------------------
# sandbox · EPF Internal IaC
# ----------------------------------------
#
# Authentication required.
# Microsoft Entra ID SSO.
#
`}
        </pre>
        <div className="mt-2 flex items-baseline gap-2 font-mono text-sm">
          <span className="text-prompt">$</span>
          <span className="text-text">sandbox auth login</span>
        </div>
        <div className="mt-8">
          <Suspense>
            <LoginButton />
          </Suspense>
        </div>
        <p className="mt-8 font-mono text-xs text-text-faint">
          <span className="text-comment"># </span>
          v1.0.0 · placeholder-session-active
        </p>
      </div>
    </div>
  );
}
```

---

## Step 5 — ConfirmModal upgrade

### File: `web/components/review/ConfirmModal.tsx`

Two changes:

**(a) Status timeline → mono glyphs.** Replace the entire `TimelineStep` + `StatusTimeline` block with:

```tsx
function StatusTimeline({
  status,
  error,
}: {
  status: DeploymentStatus | null;
  error: string | null;
}) {
  const activeIdx = activeStepIndex(status);
  return (
    <div className="font-mono text-xs leading-relaxed">
      {TIMELINE_STEPS.map((label, i) => {
        let glyph: string;
        let className: string;
        if (status === "failed" && i === TIMELINE_STEPS.length - 1) {
          glyph = "[x]";
          className = "text-error font-medium";
        } else if (i < activeIdx) {
          glyph = "[✓]";
          className = "text-success";
        } else if (i === activeIdx) {
          glyph = "[*]";
          className = "text-accent font-medium animate-pulse motion-reduce:animate-none";
        } else {
          glyph = "[ ]";
          className = "text-text-muted";
        }
        return (
          <div key={label} className={className}>
            <span className="select-none">{glyph}</span>{" "}
            <span>{label.toLowerCase()}</span>
          </div>
        );
      })}
      {status === "failed" && error && (
        <p className="mt-2 text-xs text-error font-sans">{error}</p>
      )}
    </div>
  );
}
```

**(b) Body becomes mono document.** Replace lines 156-217 body with:

```tsx
return (
  <Modal open={open} onClose={onClose} title="Deployment Submitted">
    <div className="mx-auto max-w-xl space-y-4">
      <p className="font-mono text-xs text-text-muted">
        <span className="text-comment"># </span>
        Copy the text below and share it with your approver for HOD sign-off.
      </p>

      {deploymentStatus && (
        <div aria-live="polite" aria-atomic="true" className="rounded-md border border-border bg-bg/50 p-3">
          <StatusTimeline status={deploymentStatus} error={deploymentError} />
        </div>
      )}

      <div className="relative">
        <pre
          id="proof-text"
          className="max-h-48 overflow-auto rounded-md border border-border bg-bg p-3 font-mono text-[11px] leading-relaxed text-text sm:max-h-64 sm:p-4 sm:text-xs"
        >
          {proofText}
        </pre>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleCopy}
          variant={copied ? "secondary" : "primary"}
          className="w-full"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-success" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy to Clipboard
            </>
          )}
        </Button>

        {deploymentStatus === "succeeded" && resourceGroup && (
          <Link
            href={`https://portal.azure.com/#@/${getPublicAzureEnv().tenantId}/resource/subscriptions/${getPublicAzureEnv().subscriptionId}/resourceGroups/${resourceGroup}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-transparent px-4 py-2.5 text-sm font-medium text-accent transition-all hover:bg-surface-elevated hover:border-accent/30"
          >
            <ExternalLink className="h-4 w-4" />
            View in Azure Portal
          </Link>
        )}

        <Button asChild variant="ghost" className="w-full">
          <Link href="/" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Start New Deployment
          </Link>
        </Button>
      </div>
    </div>
  </Modal>
);
```

---

## Step 6 — Cleanup

After all pages compile and tests pass:

1. `web/components/home/TemplateGrid.tsx` — delete (no longer imported anywhere)
2. `web/components/templates/TemplateCard.tsx` — delete (replaced by TemplateRow)
3. `web/components/templates/TemplateGrid.tsx` — delete (templates page now uses TemplateRow directly)

Before deleting, grep for each component to confirm zero remaining references:
```
grep -rn "TemplateGrid\|TemplateCard" web/
```

Keep `Logo` component (still in repo, just unused by Navbar after this change) — non-disruptive, future-proofing.

---

## Step 7 — Test updates

Likely impacted:
- `web/__tests__/components/layout/Breadcrumb.test.tsx` — should still pass, Breadcrumb component unchanged
- Any test that asserts the literal string "Sandbox" in a heading on home — update to assert presence of "Sandbox — Azure IaC for EPF" in the `<pre>` block
- Any test that finds `TemplateCard` or `TemplateGrid` — replace with `TemplateRow` queries

Run `npx vitest run` and fix failing tests in place. Do not silence tests with `.skip`.

---

## Step 8 — Manual verification

Per CLAUDE.md UI rule: start dev server, exercise each page in browser, confirm:

- [ ] Home renders mono hero block, line-number gutter visible on desktop
- [ ] Templates page renders editorial rows (no card grid), bundles section first, individual second
- [ ] Builder still works end-to-end (resource picker, drawer, selection)
- [ ] Review page renders mono headers, document dividers, submit still works
- [ ] My-stuff page table still loads
- [ ] Login page renders terminal panel, SSO button still clickable
- [ ] Navbar shows `~/sandbox` mono wordmark
- [ ] Footer shows single mono meta line
- [ ] All buttons are still pill-shaped and sans
- [ ] No console errors
- [ ] Keyboard nav: tab through home → templates → click first row → wizard renders

If dev server cannot be started, say so explicitly in the completion report — do not claim visual verification.

---

## Step 9 — Done criteria (sonnet, report this exactly)

```
TERMINAL_NATIVE_REDESIGN
- lint: pass | fail
- tsc:  pass | fail
- vitest: <N> passed / <M> failed
- build: pass | fail
- visual verification: complete | skipped (reason: ...)
- files created: <list>
- files modified: <list>
- files deleted: <list>
```
