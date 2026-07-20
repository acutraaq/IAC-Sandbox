# Learn Tab Step Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add optional sub-steps, expected-result, and pitfall detail to every step in the Learn tab's Power Platform guides, rendered inline in the existing static step list.

**Architecture:** Extend the existing `LearnStep` type (`web/data/learn-content.ts`) with three optional fields (`subSteps`, `expectedResult`, `pitfall`), fill them in for all 5 topics' steps, and render them conditionally inside the existing `StepWalkthrough.tsx` component — no new components, no interaction-model change (steps stay a flat, always-visible ordered list).

**Tech Stack:** Next.js 16 App Router, TypeScript strict mode, Vitest + React Testing Library, Tailwind CSS v4.

## Global Constraints

- TypeScript strict mode — no `any`, no unguarded type assertions (CLAUDE.md Coding Conventions).
- `npx tsc --noEmit` must produce 0 errors, run from `web/` (CLAUDE.md Quality Gates).
- `npm run lint` must produce 0 errors, run from `web/` (CLAUDE.md Quality Gates).
- `npx vitest run` must show all tests passing, run from `web/` — NOT from repo root (CLAUDE.md Gotchas).
- Tests co-located next to the file they cover (CLAUDE.md Coding Conventions) — matches the existing `StepWalkthrough.test.tsx`, `GuideSection.test.tsx` pattern already in `web/components/learn/`.
- No screenshots/images added — per `docs/superpowers/specs/2026-07-20-learn-step-detail-design.md`, the existing topic-level `learnMoreUrl` remains the only path to real product screenshots.
- No change to the flat, always-visible step list interaction model — no accordion, no one-step-at-a-time navigation (explicit user decision in the design spec).

---

### Task 1: Extend `LearnStep` type and render sub-steps / expected result / pitfall in `StepWalkthrough`

**Files:**
- Modify: `web/data/learn-content.ts:3-6` (the `LearnStep` interface)
- Modify: `web/components/learn/StepWalkthrough.tsx`
- Modify: `web/components/learn/StepWalkthrough.test.tsx`

**Interfaces:**
- Produces: `LearnStep` gains three new optional fields — `subSteps?: string[]`, `expectedResult?: string`, `pitfall?: string` — consumed by `StepWalkthrough.tsx` and, in Task 2, by the content in `learn-content.ts`.
- Consumes: nothing new from other tasks — `StepWalkthrough` already receives `steps: LearnStep[]` via its existing `StepWalkthroughProps`.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `web/components/learn/StepWalkthrough.test.tsx` with:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepWalkthrough } from "./StepWalkthrough";

const STEPS = [
  { title: "First step", detail: "Do the first thing." },
  { title: "Second step", detail: "Do the second thing." },
];

describe("StepWalkthrough", () => {
  it("renders every step's title and detail", () => {
    render(<StepWalkthrough steps={STEPS} />);
    expect(screen.getByText("First step")).toBeInTheDocument();
    expect(screen.getByText("Do the first thing.")).toBeInTheDocument();
    expect(screen.getByText("Second step")).toBeInTheDocument();
    expect(screen.getByText("Do the second thing.")).toBeInTheDocument();
  });

  it("renders as an ordered list", () => {
    render(<StepWalkthrough steps={STEPS} />);
    expect(screen.getByRole("list").tagName).toBe("OL");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("numbers each step starting at 1", () => {
    render(<StepWalkthrough steps={STEPS} />);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
  });

  it("renders sub-steps as a nested list when present", () => {
    const steps = [
      {
        title: "Start your app",
        detail: "Select Create.",
        subSteps: ["Select Blank canvas app", "Choose the environment"],
      },
    ];
    render(<StepWalkthrough steps={steps} />);
    expect(screen.getByText("Select Blank canvas app")).toBeInTheDocument();
    expect(screen.getByText("Choose the environment")).toBeInTheDocument();
  });

  it("renders the expected result when present", () => {
    const steps = [
      {
        title: "Preview your app",
        detail: "Select Play.",
        expectedResult: "The app runs full-screen as an end user would see it.",
      },
    ];
    render(<StepWalkthrough steps={steps} />);
    expect(
      screen.getByText("The app runs full-screen as an end user would see it.")
    ).toBeInTheDocument();
  });

  it("renders the pitfall when present", () => {
    const steps = [
      {
        title: "Sign in",
        detail: "Go to make.powerapps.com.",
        pitfall: "Signing in with a personal account shows no environments.",
      },
    ];
    render(<StepWalkthrough steps={steps} />);
    expect(
      screen.getByText("Signing in with a personal account shows no environments.")
    ).toBeInTheDocument();
  });

  it("renders cleanly with no optional fields", () => {
    render(<StepWalkthrough steps={STEPS} />);
    expect(screen.queryByText(/You should see:/)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run (from `web/`): `npx vitest run StepWalkthrough`
Expected: the 3 new tests (sub-steps, expected result, pitfall) FAIL — `subSteps`/`expectedResult`/`pitfall` aren't valid props on `LearnStep` yet and nothing renders them. TypeScript may also flag the test file for passing extra properties once the type isn't updated — that's expected at this point.

- [ ] **Step 3: Extend the `LearnStep` type**

In `web/data/learn-content.ts`, replace:

```ts
export interface LearnStep {
  title: string;
  detail: string;
}
```

with:

```ts
export interface LearnStep {
  title: string;
  detail: string;
  subSteps?: string[];
  expectedResult?: string;
  pitfall?: string;
}
```

- [ ] **Step 4: Implement rendering in `StepWalkthrough.tsx`**

Replace the full contents of `web/components/learn/StepWalkthrough.tsx` with:

```tsx
import type { LearnStep } from "@/data/learn-content";

interface StepWalkthroughProps {
  steps: LearnStep[];
}

export function StepWalkthrough({ steps }: StepWalkthroughProps) {
  return (
    <ol className="space-y-5">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <span
            className="font-mono text-sm font-semibold text-text-faint select-none"
            aria-hidden="true"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <p className="text-sm font-semibold text-text">{step.title}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-text-muted">{step.detail}</p>

            {step.subSteps && step.subSteps.length > 0 && (
              <ol className="mt-2 list-[lower-alpha] space-y-1 pl-5 text-sm leading-relaxed text-text-muted">
                {step.subSteps.map((subStep) => (
                  <li key={subStep}>{subStep}</li>
                ))}
              </ol>
            )}

            {step.expectedResult && (
              <p className="mt-2 text-sm leading-relaxed text-text-faint">
                <span className="font-semibold text-text-muted">You should see:</span>{" "}
                {step.expectedResult}
              </p>
            )}

            {step.pitfall && (
              <p className="mt-2 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-sm leading-relaxed text-text-muted">
                {step.pitfall}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run (from `web/`): `npx vitest run StepWalkthrough`
Expected: all 7 tests in `StepWalkthrough.test.tsx` PASS.

- [ ] **Step 6: Type-check**

Run (from `web/`): `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add web/data/learn-content.ts web/components/learn/StepWalkthrough.tsx web/components/learn/StepWalkthrough.test.tsx
git commit -m "feat: render optional sub-steps, expected result, and pitfalls in Learn tab steps"
```

---

### Task 2: Enrich all 5 Learn topics with sub-steps, expected results, and pitfalls

**Files:**
- Modify: `web/data/learn-content.ts:20-209` (all 5 entries in `LEARN_TOPICS`)
- Create: `web/data/learn-content.test.ts`

**Interfaces:**
- Consumes: `LearnStep` type from Task 1 (`subSteps?: string[]`, `expectedResult?: string`, `pitfall?: string`).
- Produces: nothing new consumed by later tasks — this is the last task in the plan.

- [ ] **Step 1: Write the failing content-invariant test**

Create `web/data/learn-content.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { LEARN_TOPICS } from "./learn-content";

describe("LEARN_TOPICS content invariants", () => {
  it("has 5 topics", () => {
    expect(LEARN_TOPICS).toHaveLength(5);
  });

  it("gives every step a non-empty title and detail", () => {
    for (const topic of LEARN_TOPICS) {
      for (const step of topic.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.detail.length).toBeGreaterThan(0);
      }
    }
  });

  it("never has an empty subSteps array when the field is present", () => {
    for (const topic of LEARN_TOPICS) {
      for (const step of topic.steps) {
        if (step.subSteps) {
          expect(step.subSteps.length).toBeGreaterThan(0);
          for (const subStep of step.subSteps) {
            expect(subStep.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("never has a blank expectedResult or pitfall string when the field is present", () => {
    for (const topic of LEARN_TOPICS) {
      for (const step of topic.steps) {
        if (step.expectedResult !== undefined) {
          expect(step.expectedResult.trim().length).toBeGreaterThan(0);
        }
        if (step.pitfall !== undefined) {
          expect(step.pitfall.trim().length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("gives at least one step per topic an expectedResult or a pitfall", () => {
    for (const topic of LEARN_TOPICS) {
      const enriched = topic.steps.some(
        (step) => step.expectedResult !== undefined || step.pitfall !== undefined
      );
      expect(enriched).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run (from `web/`): `npx vitest run learn-content`
Expected: the last test ("gives at least one step per topic...") FAILS, since no topic has any `expectedResult`/`pitfall` filled in yet. The other invariant tests PASS (they hold vacuously with no optional fields set).

- [ ] **Step 3: Replace `LEARN_TOPICS` with the enriched content**

Replace the full contents of `web/data/learn-content.ts` with:

```ts
export type LearnDiagramKind = "app-type-comparison" | "vibe-workflow" | "copilot-decision";

export interface LearnStep {
  title: string;
  detail: string;
  subSteps?: string[];
  expectedResult?: string;
  pitfall?: string;
}

export interface LearnTopic {
  slug: string;
  title: string;
  summary: string;
  whenToUse: string;
  callouts?: string[];
  steps: LearnStep[];
  diagram?: LearnDiagramKind;
  learnMoreUrl: string;
  learnMoreLabel: string;
}

export const LEARN_TOPICS: readonly LearnTopic[] = [
  {
    slug: "canvas-apps",
    title: "Canvas apps",
    summary:
      "Drag-and-drop, pixel-perfect design freedom. Connects to almost any data source — Excel, SharePoint, Dataverse, SQL, and 1,000+ connectors.",
    whenToUse:
      "Pick this when how the app looks matters, and your data comes from varied places.",
    diagram: "app-type-comparison",
    steps: [
      {
        title: "Sign in to Power Apps",
        detail: "Go to make.powerapps.com and sign in with your work account.",
        subSteps: [
          "Open a browser and go to make.powerapps.com",
          "Sign in with your work or school account — the same one you use for Microsoft 365",
        ],
        expectedResult:
          "You land on the Power Apps home page with a left-hand navigation menu (Home, Apps, Solutions, and so on).",
        pitfall:
          "Signing in with a personal Microsoft account instead of your work account shows no environments — always use your organization's work account.",
      },
      {
        title: "Start your app",
        detail:
          "Select Create, then choose to start from a blank canvas, from data (Dataverse, SharePoint, or Excel), or describe your app to Copilot.",
        subSteps: [
          "Select Create in the left navigation",
          "Choose Blank canvas app for full manual control, Start with data to build from an existing table, or Describe your app to Copilot to generate a starting point from a text prompt",
          "If prompted, choose the environment to create the app in",
        ],
        expectedResult:
          "Power Apps Studio opens with a blank or pre-populated canvas ready to edit.",
        pitfall:
          "Picking the wrong environment here is a common mistake — apps created in the wrong environment can't easily be moved later, so confirm the environment name in the top bar before continuing.",
      },
      {
        title: "Build the UI in Power Apps Studio",
        detail:
          "Studio opens automatically. Add and arrange controls (galleries, forms, buttons), and set data properties like Items to connect them to your data.",
        subSteps: [
          "Select Insert to add controls such as a gallery, form, or button",
          "Select a control and set its Items or Data property in the formula bar to connect it to your data source",
          "Use the Data pane to add an Excel, SharePoint, Dataverse, or SQL connection if one isn't already added",
        ],
        expectedResult:
          "Controls appear on the canvas and populate with real data once the Items property is set correctly — for example, a gallery shows rows from your table.",
        pitfall:
          "Setting Items before adding the data connection causes a red squiggly formula error — add the connection first, then reference it in the formula.",
      },
      {
        title: "Preview your app",
        detail: "Select Play in the top-right corner to try the app exactly as a user would see it.",
        expectedResult:
          "The app runs full-screen exactly as an end user would experience it — you can click buttons and scroll galleries.",
        pitfall:
          "Changes made while still in Preview mode aren't saved automatically — press Esc to exit Preview before editing further.",
      },
      {
        title: "Publish and share",
        detail: "Select Publish to save a live version, then Share to give named users or security groups access.",
        subSteps: [
          "Select Publish in the top-right, then confirm",
          "Select Share, then add named users, security groups, or a Microsoft 365 group",
          "Choose whether to also share the underlying connections the app depends on",
        ],
        expectedResult:
          "Shared users can now find the app under Apps on their own Power Apps home page, or open it via a direct link you copy.",
        pitfall:
          "Sharing the app does not automatically share the data source permissions — users without access to the underlying SharePoint or Dataverse table will see the app but no data.",
      },
    ],
    learnMoreUrl: "https://learn.microsoft.com/power-apps/maker/canvas-apps/intro-maker-portal",
    learnMoreLabel: "Get started with Power Apps canvas apps",
  },
  {
    slug: "model-driven-apps",
    title: "Model-driven apps",
    summary:
      "Data-first — you model tables and relationships in Dataverse, and the UI (forms, views, dashboards) is generated for you.",
    whenToUse:
      "Pick this for structured business processes (tracking records, approvals) where consistency matters more than custom visuals.",
    steps: [
      {
        title: "Sign in and pick a solution",
        detail:
          "Go to make.powerapps.com, select Solutions, then create or open a solution to build in — this keeps everything portable between environments.",
        subSteps: [
          "Go to make.powerapps.com and sign in with your work account",
          "Select Solutions in the left navigation",
          "Select New solution (or open an existing one) and give it a name and publisher",
        ],
        expectedResult: "The solution opens to an empty objects list, ready for you to add an app.",
        pitfall:
          "Building directly outside a solution works for quick tests, but makes the app hard to move between environments later — always build inside a solution for anything real.",
      },
      {
        title: "Create the app",
        detail: "Select New > App > Model-driven app, give it a name, and it opens in the app designer.",
        expectedResult:
          "The app designer opens with empty Pages, Site map, and Data panes.",
      },
      {
        title: "Add a table-based page",
        detail: "Select Add page > Dataverse table, choose the table you want (e.g. Account), and select Add.",
        subSteps: [
          "Select Add page > Dataverse table in the app designer",
          "Search for and select the table you want (e.g. Account)",
          "Choose which views and forms to include, or accept the defaults",
          "Select Add",
        ],
        expectedResult:
          "The table appears in the Pages pane, and a preview of its list view shows on the canvas.",
        pitfall:
          "If the table doesn't appear in the search list, it likely isn't included in the solution yet — add the table to the solution first via Solutions > Add existing > Table.",
      },
      {
        title: "Arrange navigation",
        detail: "Use the Pages pane to review the generated navigation; add more table pages as needed.",
        expectedResult:
          "The Site map preview updates live as you reorder or rename pages.",
      },
      {
        title: "Save, publish, and play",
        detail: "Select Save, then Publish to make it available to users. Select Play to try it in a full browser window.",
        subSteps: [
          "Select Save in the command bar",
          "Select Publish to make the app available to users",
          "Select Play to open the app in a new browser tab",
        ],
        expectedResult:
          "The app opens in a full browser window showing your table's data in the generated views and forms.",
        pitfall:
          "Save does not publish — changes stay invisible to other users until you explicitly select Publish.",
      },
    ],
    learnMoreUrl: "https://learn.microsoft.com/power-apps/maker/model-driven-apps/build-first-model-driven-app",
    learnMoreLabel: "Build your first model-driven app",
  },
  {
    slug: "vibe",
    title: "Power Apps vibe",
    summary:
      "The newest, AI-native way to build — describe your app in plain English, and AI generates the data model, logic, and UI together in one workspace.",
    whenToUse: "Pick this for rapid prototyping when you don't want to touch a designer at all.",
    diagram: "vibe-workflow",
    callouts: [
      "Preview feature — a tenant admin must enable Copilot in Power Apps first.",
      "Only available in the US, Australia, Asia, and India regions, in English.",
      "Canvas and model-driven apps can't be built in this experience — and you can't hand-edit the generated code directly.",
    ],
    steps: [
      {
        title: "Open Power Apps vibe",
        detail: "Go to vibe.powerapps.com, or select Try new experience (Preview) inside make.powerapps.com.",
        expectedResult:
          "A blank prompt box opens, similar to a chat interface, ready for your app description.",
        pitfall:
          "Vibe is a preview feature — if you don't see it or the Try new experience toggle, ask a tenant admin to enable Copilot in Power Apps first.",
      },
      {
        title: "Describe your app",
        detail:
          "Type a prompt describing the app you want. Plan mode is on by default — it proposes a plan and may ask clarifying questions before building anything.",
        subSteps: [
          'Type a plain-English description of the app you want (e.g. "an app to track team expense claims with approval status")',
          "Answer any clarifying questions the assistant asks before it proposes a plan",
        ],
        expectedResult:
          "A written plan appears describing the screens, data tables, and logic it intends to build, before anything is actually created.",
      },
      {
        title: "Accept the plan",
        detail: "Review the proposed plan, answer any follow-up questions, then select Accept this plan and create app.",
        expectedResult:
          "The workspace switches from the plan view to a live build, with a progress indicator while the app, data, and code generate.",
        pitfall:
          "Once you accept, canvas- or model-driven-style manual editing of the underlying code isn't available — if you need hands-on control, use Canvas or Model-driven apps instead.",
      },
      {
        title: "Review what's generated",
        detail:
          "The AI generates the app, a data model, and code together. Switch between Plan, Data, and App views to inspect each part.",
        subSteps: [
          "Select the Plan tab to see what was built and why",
          "Select the Data tab to inspect the generated tables and sample rows",
          "Select the App tab to interact with the generated screens directly",
        ],
        expectedResult:
          "Each tab shows a consistent view of the same app — for example, a table you see in Data also appears wired to a screen in App.",
      },
      {
        title: "Refine it",
        detail:
          'Ask for changes in the chat (e.g. "change the theme to blue") or toggle inline edits to adjust an element directly — no need to touch code.',
        expectedResult:
          "The requested change appears within a few seconds without you touching a designer.",
        pitfall:
          'Very large or ambiguous refinement requests (e.g. "make it better") tend to produce inconsistent results — ask for one specific, concrete change at a time.',
      },
      {
        title: "Publish and share",
        detail: "Select Publish draft tables to make your data permanent, then Publish the app, then Share it with your team.",
        subSteps: [
          "Select Publish draft tables to make your generated data permanent — draft tables are temporary until this step",
          "Select Publish to make the app itself live",
          "Select Share and add the users or groups who need access",
        ],
        expectedResult:
          "The app is now listed under Apps for everyone you shared it with, and its data tables persist instead of being wiped.",
        pitfall:
          "Skipping Publish draft tables means your data resets the next time you reopen the vibe workspace — always publish tables before relying on the data.",
      },
    ],
    learnMoreUrl: "https://learn.microsoft.com/power-apps/vibe/overview",
    learnMoreLabel: "Overview of the new Power Apps vibe experience",
  },
  {
    slug: "copilot-studio",
    title: "Copilot Studio",
    summary:
      "Standalone, no-code tool for building conversational AI agents. More powerful and configurable than Copilot agents: custom topics, many knowledge sources, tool/action integrations, and publishing to many channels.",
    whenToUse:
      'Pick this when you need "a chatbot that answers questions and takes actions across systems."',
    steps: [
      {
        title: "Sign in",
        detail: "Go to copilotstudio.microsoft.com and sign in.",
        expectedResult:
          "The Copilot Studio home page loads with a prompt to describe an agent or start blank.",
      },
      {
        title: "Describe your agent",
        detail:
          "On the Home page, describe what you want your agent to do in your own words — Copilot Studio generates a name, instructions, and suggested knowledge/tools. Or select Create blank agent for full manual control.",
        subSteps: [
          "On the Home page, type a description of what the agent should do",
          "Review the suggested name, instructions, and knowledge/tools it proposes",
          "Select Create, or select Create blank agent instead for full manual control from the start",
        ],
        expectedResult:
          "The agent's overview page opens showing its generated (or blank) instructions.",
      },
      {
        title: "Add knowledge",
        detail:
          "On the Knowledge page, add sources like public websites, SharePoint sites, or uploaded files so the agent can answer from real content.",
        subSteps: [
          "Go to the Knowledge page",
          "Select Add knowledge",
          "Choose a source type: public website URL, SharePoint site, or uploaded files",
          "Wait for the source to finish indexing before testing",
        ],
        expectedResult:
          "The knowledge source appears in the list with a Ready status once indexing completes.",
        pitfall:
          "Testing the agent before a knowledge source finishes indexing (still showing Processing) gives incomplete or missing answers — wait for Ready first.",
      },
      {
        title: "Add tools and topics",
        detail: "Add Tools for actions the agent can take, and Topics for specific conversation flows, as your scenario needs.",
        expectedResult:
          "New tools and topics appear in their respective lists and become available for the agent to use in conversation.",
      },
      {
        title: "Test it",
        detail: "Use the built-in Test your agent chat panel on the right to try real questions before publishing.",
        expectedResult:
          "The panel responds using the instructions, knowledge, and tools configured so far, letting you catch gaps before publishing.",
        pitfall:
          "Testing only happy-path questions misses real gaps — also try questions outside the intended scope, to see how the agent declines or redirects.",
      },
      {
        title: "Publish",
        detail: "Select Publish, then share the demo website link or connect a channel like Microsoft Teams.",
        subSteps: [
          "Select Publish in the top right",
          "Copy the demo website link to share directly, or go to Channels to connect Microsoft Teams or another channel",
        ],
        expectedResult:
          "The published version is live at the shared link or channel, separate from any further unpublished edits you make.",
        pitfall:
          "Edits made after publishing don't reach users until you publish again — the demo link always reflects the last published version, not your latest draft.",
      },
    ],
    learnMoreUrl: "https://learn.microsoft.com/microsoft-copilot-studio/fundamentals-get-started",
    learnMoreLabel: "Quickstart: Create and deploy an agent",
  },
  {
    slug: "copilot-agents",
    title: "Copilot agents (Agent Builder)",
    summary:
      "The lightweight way to build an agent — directly inside Microsoft 365 Copilot chat, Teams, or SharePoint, no separate tool to learn.",
    whenToUse:
      "Pick this for quick, single-purpose helpers (e.g. \"answer questions about our onboarding docs\").",
    diagram: "copilot-decision",
    callouts: [
      "Need multi-step workflows, external system actions, or more knowledge sources? That's when to move up to Copilot Studio (previous tab).",
    ],
    steps: [
      {
        title: "Open Agent Builder",
        detail: "In Microsoft 365 Copilot (microsoft365.com/chat, Teams, or office.com/chat), select New agent.",
        expectedResult: "The New agent screen opens with Describe and Configure tabs.",
      },
      {
        title: "Describe it",
        detail:
          "On the Describe tab, describe what you want in natural language — or start from a template, or switch to the Configure tab to set description/instructions/knowledge manually.",
        subSteps: [
          "On the Describe tab, type what you want the agent to do in plain language, or pick a starting template",
          "Switch to the Configure tab at any time to directly edit the generated description, instructions, and starter prompts",
        ],
        expectedResult:
          "The Configure tab fills in with a name, description, and instructions matching what you described.",
      },
      {
        title: "Add knowledge",
        detail:
          "Add knowledge sources such as SharePoint sites, files, or (with a Copilot license) your own emails and chats for grounded answers.",
        expectedResult:
          "Selected SharePoint sites, files, or (with a Copilot license) your own mail and chats appear listed as knowledge sources the agent can draw from.",
        pitfall:
          "Adding your own emails or chats as a knowledge source requires a Copilot license — without one, that option won't be selectable.",
      },
      {
        title: "Test it",
        detail: "Use the Try it tab to chat with your agent and refine its instructions until answers look right.",
        expectedResult:
          "The Try it panel answers using only the instructions and knowledge configured so far, showing you gaps to fix before sharing.",
      },
      {
        title: "Share it",
        detail: "Save your agent and share it with others in your organization directly from Microsoft 365 Copilot.",
        subSteps: [
          "Select Save",
          "Select Share and choose the people or groups in your organization to share with",
        ],
        expectedResult:
          "Shared users see the new agent listed inside Microsoft 365 Copilot the next time they open it.",
        pitfall:
          "Sharing the agent doesn't share its knowledge source permissions automatically — recipients without access to a linked SharePoint site will get answers with gaps from that source.",
      },
    ],
    learnMoreUrl: "https://learn.microsoft.com/microsoft-365/copilot/extensibility/agent-builder",
    learnMoreLabel: "Agent Builder in Microsoft 365 Copilot",
  },
];
```

- [ ] **Step 4: Run the content-invariant test to verify it passes**

Run (from `web/`): `npx vitest run learn-content`
Expected: all 5 tests in `learn-content.test.ts` PASS.

- [ ] **Step 5: Run the full Learn tab test suite**

Run (from `web/`): `npx vitest run learn`
Expected: all test files under `web/components/learn/`, `web/data/learn-content.test.ts`, and `web/__tests__/app/learn/` PASS (this re-runs `LearnTabs.test.tsx` and `GuideSection.test.tsx`, which reference `LEARN_TOPICS` directly and must still pass against the enriched content).

- [ ] **Step 6: Run the full quality gate**

Run (from `web/`):
```bash
npm run lint
npx tsc --noEmit
npx vitest run
```
Expected: lint 0 errors, tsc 0 errors, full suite passes (274 pre-existing tests + the new ones added in this plan).

- [ ] **Step 7: Commit**

```bash
git add web/data/learn-content.ts web/data/learn-content.test.ts
git commit -m "feat: add sub-steps, expected results, and pitfalls to all Learn tab guides"
```
