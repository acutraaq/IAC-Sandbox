# Design: Power Platform "Learn" Catalog

> **Date:** 2026-07-17 | **Status:** Draft — pending user review | **Author:** Claude (session)

## Purpose

Add a new, self-contained content section to the app — a beginner-friendly, step-by-step guide covering five Power Platform app-building paths: Canvas apps, Model-driven apps, Power Apps vibe (AI-native preview experience), Copilot Studio, and Copilot agents (Agent Builder in Microsoft 365 Copilot). This is **not** a deployment feature — it does not touch ARM, the deployment queue, or any API route. It's a static, educational reference page for EPF staff with no prior Power Platform experience.

## Non-goals

- No integration with the Template Flow, deployment store, or ARM builders.
- No CMS/admin editing UI — content is authored as static TypeScript data, edited via code changes like any other page.
- No screenshots of real Microsoft product UI (avoids staleness as Microsoft's UI changes, and avoids redistributing Microsoft's own screenshots). All visuals are custom-built diagrams matching this app's own design system.
- No live links out mid-guide requiring internet access to follow along — external Microsoft Learn links are supplementary "learn more," not required reading.

## Audience & content depth

Total beginner, non-technical (EPF business users, zero assumed Power Platform experience). Each of the 5 sections follows the same shape: **short concept intro (what it is, why/when you'd pick it) → numbered step-by-step walkthrough → optional "learn more" link to the official Microsoft Learn article**.

## Navigation & routing

- New top-level nav item **"Learn"** in `Navbar`, alongside the existing Templates link.
- Single route: `web/app/learn/page.tsx`.
- In-page tab switcher between the 5 topics (client-side state, no sub-routes) — matches the existing single-page depth of the rest of the app and avoids scaffolding 5 routes for what is fundamentally one guide.

## Content: the 5 sections

Sourced from Microsoft Learn (fetched live during design, 2026-07-17) to avoid stale/hallucinated UI steps.

### 1. Canvas apps
**What/why:** Drag-and-drop, pixel-perfect design freedom, connects to almost any data source (Excel, SharePoint, Dataverse, SQL, 1000+ connectors). Best when the app's *look* matters and data comes from varied places.
**Steps:** Sign in at make.powerapps.com → choose **Create** → start from blank, from data (Dataverse/SharePoint/Excel), or describe it to Copilot → Power Apps Studio opens → add/arrange controls, set the `Items`/data properties → **Play** to preview → **Publish** and **Share**.
**Learn more:** [Get started with Power Apps canvas apps](https://learn.microsoft.com/power-apps/maker/canvas-apps/intro-maker-portal)

### 2. Model-driven apps
**What/why:** Data-first — you model tables/relationships in Dataverse and the UI (forms, views, dashboards) is generated for you. Best for structured business processes (tracking records, approvals) where consistency matters more than custom visuals.
**Steps:** Sign in at make.powerapps.com → **Solutions** → create/open a solution → **New → App → Model-driven app** → name it → **Add page → Dataverse table** → pick a table (e.g. Account) → arrange navigation → **Save**, then **Publish** → **Play** to try it.
**Learn more:** [Build your first model-driven app](https://learn.microsoft.com/power-apps/maker/model-driven-apps/build-first-model-driven-app)

### 3. Power Apps vibe (preview)
**What/why:** The newest, AI-native way to build — describe your app in plain English, and AI generates the data model, logic, and UI together in one workspace. Best for rapid prototyping when you don't want to touch a designer at all.
**Steps:** Go to vibe.powerapps.com (or toggle **Try new experience (Preview)** inside make.powerapps.com) → type a prompt describing the app you want (Plan mode reviews a proposed plan first — answer any clarifying questions) → **Accept this plan and create app** → AI generates app + data model + code → refine using chat ("change the theme to blue") or inline visual edits → **Publish draft tables**, then **Publish** the app → **Share**.
**Callouts:** Preview feature — needs a tenant admin to enable Copilot in Power Apps; only available in US/Australia/Asia/India regions, English only; canvas and model-driven apps are *not* buildable in this experience; you can't hand-edit the generated code directly.
**Learn more:** [Overview of the new Power Apps vibe experience](https://learn.microsoft.com/power-apps/vibe/overview)

### 4. Copilot Studio
**What/why:** Standalone, no-code tool for building conversational AI agents — the "I need a chatbot that answers questions / takes actions across systems" path. More powerful and more configurable than Copilot agents (below): supports custom topics, many knowledge sources, tool/action integrations, and publishing to many channels (Teams, web, etc.).
**Steps:** Sign in at copilotstudio.microsoft.com → describe what you want your agent to do in your own words (AI generates name/instructions/suggested knowledge & tools) or **Create blank agent** → review/accept suggestions → add knowledge sources (public websites, SharePoint, files) → add tools/topics as needed → test in the built-in chat panel → **Publish** → share the demo website link or connect a channel.
**Learn more:** [Quickstart: Create and deploy an agent](https://learn.microsoft.com/microsoft-copilot-studio/fundamentals-get-started)

### 5. Copilot agents (Agent Builder in Microsoft 365 Copilot)
**What/why:** The lightweight way to build an agent — directly inside Microsoft 365 Copilot chat, Teams, or SharePoint, no separate tool to learn. Good for quick, single-purpose helpers (e.g. "answer questions about our onboarding docs"). When you outgrow it — need multi-step workflows, external system actions, or advanced governance — that's when to move up to Copilot Studio.
**Steps:** In Microsoft 365 Copilot (microsoft365.com/chat, Teams, or office.com/chat), select **New agent** → describe what you want in natural language on the **Describe** tab (or build manually on **Configure**: description, instructions, knowledge, starter prompts) → optionally start from a template → **Try it** to test → save/share with others in your org.
**Learn more:** [Agent Builder in Microsoft 365 Copilot](https://learn.microsoft.com/microsoft-365/copilot/extensibility/agent-builder)

## Visual diagrams (custom, no product screenshots)

Three custom SVG diagrams, styled to match the app's existing mono/terminal-native design system (thin strokes, IBM Plex Mono labels, existing CSS variable tokens — see `DESIGN.md`):

1. **App-type comparison** — Canvas vs Model-driven vs Vibe, plotted on two axes (data-first ↔ design-first, manual ↔ AI-generated), helping a reader pick a starting point.
2. **Vibe workflow** — prompt → plan (review/clarify) → generated app + data + code → refine loop (chat / inline edits) → publish.
3. **Copilot decision diagram** — simple decision tree: "quick Q&A agent for one team" → Copilot agents (Agent Builder); "multi-step workflow, external systems, many users" → Copilot Studio.

## Components

```
web/app/learn/page.tsx                        — page shell
web/components/learn/
  LearnTabs.tsx                                — tab switcher (useState, no Zustand — single-page local UI state)
  GuideSection.tsx                             — renders one topic: intro, callouts, StepWalkthrough, "learn more" link
  StepWalkthrough.tsx                           — numbered step list (same visual language as existing NumberedBlock)
  diagrams/
    AppTypeComparisonDiagram.tsx
    VibeWorkflowDiagram.tsx
    CopilotDecisionDiagram.tsx
web/data/learn-content.ts                       — typed content: 5 topics as {slug, title, summary, whenToUse, callouts?, steps[], learnMoreUrl, learnMoreLabel}
```

No API routes, no Zod schema, no store changes, no ARM/queue involvement.

## Testing

Static content — one smoke test: `LearnTabs.test.tsx` renders all 5 tabs and confirms switching tabs shows the right `GuideSection` content. No changes to `functions/`, no schema-drift risk, no CI job changes needed.

## Open questions / explicit decisions

- Section 3 covers **vibe only** (not the separate pro-dev "Power Apps Code Apps" CLI product) — confirmed with user; these are two distinct Microsoft products despite the similar naming.
- Preview-feature callouts (region/license restrictions) are included inline per section rather than a single disclaimer banner, since restrictions differ per feature (vibe vs Copilot Studio vs Canvas/Model-driven, which are all GA).
