# Power Platform Learn Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `/learn` page — a beginner-friendly, step-by-step guide covering 5 Power Platform app-building paths (Canvas apps, Model-driven apps, Power Apps vibe, Copilot Studio, Copilot agents/Agent Builder) — reachable from a new "Learn" nav link.

**Architecture:** Fully static, presentational feature. One route (`web/app/learn/page.tsx`) renders a client-side tab switcher (`LearnTabs`) over 5 topics defined in a typed content file (`web/data/learn-content.ts`). Each topic renders through a shared `GuideSection` component (intro + numbered steps + optional custom SVG diagram + optional callouts + external "learn more" link). No API routes, no Zod schema, no store, no ARM/queue involvement.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind CSS v4 (existing CSS variable tokens), Framer Motion (via existing `PageTransition`), Vitest + React Testing Library.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-07-17-powerapps-learn-catalog-design.md` — read it for full content rationale.
- No real Microsoft product screenshots — all visuals are custom SVG diagrams using this app's existing color tokens (`--color-*` in `web/app/globals.css`).
- Section 3 covers **Power Apps vibe only** (not the separate pro-dev "Power Apps Code Apps" CLI product) — confirmed decision, do not add Code Apps content.
- TypeScript strict mode, no `any`.
- Tests: run `npx vitest run` from `web/` (not repo root). Lint (`npm run lint`) and `npx tsc --noEmit` must both be 0 errors before this is done.
- Reuse existing components where they fit: `FilterPills` (tab buttons), `PageTransition`, `PageEyebrow` — do not duplicate their logic.
- Follow existing co-location convention: component tests live next to the component (`Foo.tsx` + `Foo.test.tsx`); page/route tests live under `web/__tests__/app/...` mirroring the route path.

---

### Task 1: Learn content data module

**Files:**
- Create: `web/data/learn-content.ts`
- Test: `web/__tests__/data/learn-content.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type LearnDiagramKind = "app-type-comparison" | "vibe-workflow" | "copilot-decision";

  export interface LearnStep {
    title: string;
    detail: string;
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

  export const LEARN_TOPICS: LearnTopic[];
  ```

- [ ] **Step 1: Write the failing test**

Create `web/__tests__/data/learn-content.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { LEARN_TOPICS } from "@/data/learn-content";

describe("LEARN_TOPICS", () => {
  it("has exactly 5 topics in the expected order", () => {
    expect(LEARN_TOPICS.map((t) => t.slug)).toEqual([
      "canvas-apps",
      "model-driven-apps",
      "vibe",
      "copilot-studio",
      "copilot-agents",
    ]);
  });

  it("gives every topic at least one step, a title, and a learn-more link", () => {
    for (const topic of LEARN_TOPICS) {
      expect(topic.title.length).toBeGreaterThan(0);
      expect(topic.summary.length).toBeGreaterThan(0);
      expect(topic.whenToUse.length).toBeGreaterThan(0);
      expect(topic.steps.length).toBeGreaterThan(0);
      expect(topic.learnMoreUrl).toMatch(/^https:\/\/learn\.microsoft\.com\//);
      expect(topic.learnMoreLabel.length).toBeGreaterThan(0);
    }
  });

  it("assigns each diagram to exactly one topic", () => {
    const diagrams = LEARN_TOPICS.map((t) => t.diagram).filter(Boolean);
    expect(diagrams).toEqual(["app-type-comparison", "vibe-workflow", "copilot-decision"]);
  });

  it("flags the vibe topic as a preview feature via its callouts", () => {
    const vibe = LEARN_TOPICS.find((t) => t.slug === "vibe");
    expect(vibe?.callouts?.some((c) => c.toLowerCase().includes("preview"))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `web/`): `npx vitest run "learn-content"`
Expected: FAIL — `Cannot find module '@/data/learn-content'` or similar.

- [ ] **Step 3: Write the content module**

Create `web/data/learn-content.ts`:

```ts
export type LearnDiagramKind = "app-type-comparison" | "vibe-workflow" | "copilot-decision";

export interface LearnStep {
  title: string;
  detail: string;
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

export const LEARN_TOPICS: LearnTopic[] = [
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
      },
      {
        title: "Start your app",
        detail:
          "Select Create, then choose to start from a blank canvas, from data (Dataverse, SharePoint, or Excel), or describe your app to Copilot.",
      },
      {
        title: "Build the UI in Power Apps Studio",
        detail:
          "Studio opens automatically. Add and arrange controls (galleries, forms, buttons), and set data properties like Items to connect them to your data.",
      },
      {
        title: "Preview your app",
        detail: "Select Play in the top-right corner to try the app exactly as a user would see it.",
      },
      {
        title: "Publish and share",
        detail: "Select Publish to save a live version, then Share to give named users or security groups access.",
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
      },
      {
        title: "Create the app",
        detail: "Select New > App > Model-driven app, give it a name, and it opens in the app designer.",
      },
      {
        title: "Add a table-based page",
        detail: "Select Add page > Dataverse table, choose the table you want (e.g. Account), and select Add.",
      },
      {
        title: "Arrange navigation",
        detail: "Use the Pages pane to review the generated navigation; add more table pages as needed.",
      },
      {
        title: "Save, publish, and play",
        detail: "Select Save, then Publish to make it available to users. Select Play to try it in a full browser window.",
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
      },
      {
        title: "Describe your app",
        detail:
          "Type a prompt describing the app you want. Plan mode is on by default — it proposes a plan and may ask clarifying questions before building anything.",
      },
      {
        title: "Accept the plan",
        detail: "Review the proposed plan, answer any follow-up questions, then select Accept this plan and create app.",
      },
      {
        title: "Review what's generated",
        detail:
          "The AI generates the app, a data model, and code together. Switch between Plan, Data, and App views to inspect each part.",
      },
      {
        title: "Refine it",
        detail:
          'Ask for changes in the chat (e.g. "change the theme to blue") or toggle inline edits to adjust an element directly — no need to touch code.',
      },
      {
        title: "Publish and share",
        detail: "Select Publish draft tables to make your data permanent, then Publish the app, then Share it with your team.",
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
      },
      {
        title: "Describe your agent",
        detail:
          "On the Home page, describe what you want your agent to do in your own words — Copilot Studio generates a name, instructions, and suggested knowledge/tools. Or select Create blank agent for full manual control.",
      },
      {
        title: "Add knowledge",
        detail:
          "On the Knowledge page, add sources like public websites, SharePoint sites, or uploaded files so the agent can answer from real content.",
      },
      {
        title: "Add tools and topics",
        detail: "Add Tools for actions the agent can take, and Topics for specific conversation flows, as your scenario needs.",
      },
      {
        title: "Test it",
        detail: "Use the built-in Test your agent chat panel on the right to try real questions before publishing.",
      },
      {
        title: "Publish",
        detail: "Select Publish, then share the demo website link or connect a channel like Microsoft Teams.",
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
      },
      {
        title: "Describe it",
        detail:
          "On the Describe tab, describe what you want in natural language — or start from a template, or switch to the Configure tab to set description/instructions/knowledge manually.",
      },
      {
        title: "Add knowledge",
        detail:
          "Add knowledge sources such as SharePoint sites, files, or (with a Copilot license) your own emails and chats for grounded answers.",
      },
      {
        title: "Test it",
        detail: "Use the Try it tab to chat with your agent and refine its instructions until answers look right.",
      },
      {
        title: "Share it",
        detail: "Save your agent and share it with others in your organization directly from Microsoft 365 Copilot.",
      },
    ],
    learnMoreUrl: "https://learn.microsoft.com/microsoft-365/copilot/extensibility/agent-builder",
    learnMoreLabel: "Agent Builder in Microsoft 365 Copilot",
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `web/`): `npx vitest run "learn-content"`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add web/data/learn-content.ts web/__tests__/data/learn-content.test.ts
git commit -m "feat: add Power Platform learn catalog content data"
```

---

### Task 2: StepWalkthrough component

**Files:**
- Create: `web/components/learn/StepWalkthrough.tsx`
- Test: `web/components/learn/StepWalkthrough.test.tsx`

**Interfaces:**
- Consumes: `LearnStep` from Task 1 (`@/data/learn-content`)
- Produces: `StepWalkthrough({ steps }: { steps: LearnStep[] })` — default export not used, named export `StepWalkthrough`.

- [ ] **Step 1: Write the failing test**

Create `web/components/learn/StepWalkthrough.test.tsx`:

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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `web/`): `npx vitest run "StepWalkthrough"`
Expected: FAIL — `Cannot find module './StepWalkthrough'`.

- [ ] **Step 3: Write minimal implementation**

Create `web/components/learn/StepWalkthrough.tsx`:

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
          </div>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `web/`): `npx vitest run "StepWalkthrough"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/components/learn/StepWalkthrough.tsx web/components/learn/StepWalkthrough.test.tsx
git commit -m "feat: add StepWalkthrough component for learn guide steps"
```

---

### Task 3: Diagram components

**Files:**
- Create: `web/components/learn/diagrams/AppTypeComparisonDiagram.tsx`
- Create: `web/components/learn/diagrams/VibeWorkflowDiagram.tsx`
- Create: `web/components/learn/diagrams/CopilotDecisionDiagram.tsx`
- Test: `web/components/learn/diagrams/diagrams.test.tsx`

**Interfaces:**
- Produces: `AppTypeComparisonDiagram()`, `VibeWorkflowDiagram()`, `CopilotDecisionDiagram()` — all no-prop, named exports. Each renders a `<figure>` with an `aria-hidden` SVG plus a visible `<figcaption>` legend (accessible text lives in real HTML, not inside the SVG).

- [ ] **Step 1: Write the failing test**

Create `web/components/learn/diagrams/diagrams.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppTypeComparisonDiagram } from "./AppTypeComparisonDiagram";
import { VibeWorkflowDiagram } from "./VibeWorkflowDiagram";
import { CopilotDecisionDiagram } from "./CopilotDecisionDiagram";

describe("AppTypeComparisonDiagram", () => {
  it("labels all three app types", () => {
    render(<AppTypeComparisonDiagram />);
    expect(screen.getByText("Canvas")).toBeInTheDocument();
    expect(screen.getByText("Model-driven")).toBeInTheDocument();
    expect(screen.getByText("Vibe")).toBeInTheDocument();
  });
});

describe("VibeWorkflowDiagram", () => {
  it("shows the 5-stage vibe workflow in order", () => {
    render(<VibeWorkflowDiagram />);
    const stages = ["Prompt", "Plan", "Generate", "Refine", "Publish"];
    for (const stage of stages) {
      expect(screen.getByText(stage)).toBeInTheDocument();
    }
  });
});

describe("CopilotDecisionDiagram", () => {
  it("shows both decision branches", () => {
    render(<CopilotDecisionDiagram />);
    expect(screen.getByText(/Copilot agents/)).toBeInTheDocument();
    expect(screen.getByText(/Copilot Studio/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `web/`): `npx vitest run "diagrams"`
Expected: FAIL — `Cannot find module './AppTypeComparisonDiagram'`.

- [ ] **Step 3: Write the diagram components**

Create `web/components/learn/diagrams/AppTypeComparisonDiagram.tsx`:

```tsx
export function AppTypeComparisonDiagram() {
  return (
    <figure className="rounded-lg border border-border bg-surface p-4">
      <svg
        viewBox="0 0 320 200"
        className="w-full text-text-faint"
        aria-hidden="true"
        role="presentation"
      >
        {/* axes */}
        <line x1="40" y1="10" x2="40" y2="170" stroke="currentColor" strokeWidth="1" />
        <line x1="40" y1="170" x2="310" y2="170" stroke="currentColor" strokeWidth="1" />
        <text x="10" y="15" className="fill-text-faint text-[9px] font-mono">AI-built</text>
        <text x="10" y="178" className="fill-text-faint text-[9px] font-mono">Manual</text>
        <text x="250" y="185" className="fill-text-faint text-[9px] font-mono">Data-first</text>
        <text x="45" y="185" className="fill-text-faint text-[9px] font-mono">Design-first</text>

        {/* Canvas: manual, design-first */}
        <circle cx="90" cy="140" r="6" className="fill-accent" />
        {/* Model-driven: manual, data-first */}
        <circle cx="250" cy="140" r="6" className="fill-accent" />
        {/* Vibe: AI-built, either */}
        <circle cx="170" cy="40" r="6" className="fill-accent" />
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-text-muted">
        <span>Canvas — design-first, manual</span>
        <span>Model-driven — data-first, manual</span>
        <span>Vibe — AI-generated from a prompt</span>
      </figcaption>
    </figure>
  );
}
```

Create `web/components/learn/diagrams/VibeWorkflowDiagram.tsx`:

```tsx
const STAGES = ["Prompt", "Plan", "Generate", "Refine", "Publish"];

export function VibeWorkflowDiagram() {
  return (
    <figure className="rounded-lg border border-border bg-surface p-4">
      <svg
        viewBox="0 0 500 80"
        className="w-full text-text-faint"
        aria-hidden="true"
        role="presentation"
      >
        {STAGES.map((_, i) => {
          const x = 10 + i * 98;
          return (
            <g key={i}>
              <rect
                x={x}
                y="20"
                width="80"
                height="40"
                rx="6"
                className="fill-surface-elevated stroke-border"
                strokeWidth="1"
              />
              {i < STAGES.length - 1 && (
                <line
                  x1={x + 80}
                  y1="40"
                  x2={x + 98}
                  y2="40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  markerEnd="url(#arrow)"
                />
              )}
            </g>
          );
        })}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 Z" className="fill-text-faint" />
          </marker>
        </defs>
      </svg>
      <figcaption className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-text-muted">
        {STAGES.map((stage) => (
          <span key={stage}>{stage}</span>
        ))}
      </figcaption>
    </figure>
  );
}
```

Create `web/components/learn/diagrams/CopilotDecisionDiagram.tsx`:

```tsx
export function CopilotDecisionDiagram() {
  return (
    <figure className="rounded-lg border border-border bg-surface p-4">
      <svg
        viewBox="0 0 320 140"
        className="w-full text-text-faint"
        aria-hidden="true"
        role="presentation"
      >
        <rect x="90" y="5" width="140" height="34" rx="6" className="fill-surface-elevated stroke-border" strokeWidth="1" />
        <line x1="160" y1="39" x2="70" y2="80" stroke="currentColor" strokeWidth="1.5" />
        <line x1="160" y1="39" x2="250" y2="80" stroke="currentColor" strokeWidth="1.5" />
        <rect x="5" y="80" width="130" height="50" rx="6" className="fill-accent-glow stroke-accent/40" strokeWidth="1" />
        <rect x="185" y="80" width="130" height="50" rx="6" className="fill-accent-glow stroke-accent/40" strokeWidth="1" />
      </svg>
      <figcaption className="mt-3 grid grid-cols-1 gap-3 font-mono text-xs text-text-muted sm:grid-cols-2">
        <span>Quick Q&amp;A for one team → Copilot agents (Agent Builder)</span>
        <span>Multi-step workflow, external systems, many users → Copilot Studio</span>
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `web/`): `npx vitest run "diagrams"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/components/learn/diagrams/
git commit -m "feat: add custom SVG diagrams for the learn catalog"
```

---

### Task 4: GuideSection component

**Files:**
- Create: `web/components/learn/GuideSection.tsx`
- Test: `web/components/learn/GuideSection.test.tsx`

**Interfaces:**
- Consumes: `LearnTopic` (Task 1), `StepWalkthrough` (Task 2), `AppTypeComparisonDiagram` / `VibeWorkflowDiagram` / `CopilotDecisionDiagram` (Task 3)
- Produces: `GuideSection({ topic }: { topic: LearnTopic })`

- [ ] **Step 1: Write the failing test**

Create `web/components/learn/GuideSection.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { GuideSection } from "./GuideSection";
import type { LearnTopic } from "@/data/learn-content";

const BASE_TOPIC: LearnTopic = {
  slug: "test-topic",
  title: "Test Topic",
  summary: "A summary of the test topic.",
  whenToUse: "Use this when testing.",
  steps: [{ title: "Do a thing", detail: "The detail of doing a thing." }],
  learnMoreUrl: "https://learn.microsoft.com/test",
  learnMoreLabel: "Read more about testing",
};

describe("GuideSection", () => {
  it("renders the topic title, summary, and when-to-use text", () => {
    render(<GuideSection topic={BASE_TOPIC} />);
    expect(screen.getByRole("heading", { name: "Test Topic" })).toBeInTheDocument();
    expect(screen.getByText("A summary of the test topic.")).toBeInTheDocument();
    expect(screen.getByText("Use this when testing.")).toBeInTheDocument();
  });

  it("renders the step walkthrough", () => {
    render(<GuideSection topic={BASE_TOPIC} />);
    expect(screen.getByText("Do a thing")).toBeInTheDocument();
  });

  it("renders the learn-more link with the correct href", () => {
    render(<GuideSection topic={BASE_TOPIC} />);
    expect(screen.getByRole("link", { name: /Read more about testing/ })).toHaveAttribute(
      "href",
      "https://learn.microsoft.com/test"
    );
  });

  it("does not render a diagram when the topic has none", () => {
    render(<GuideSection topic={BASE_TOPIC} />);
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
  });

  it("renders the matching diagram when the topic specifies one", () => {
    render(<GuideSection topic={{ ...BASE_TOPIC, diagram: "vibe-workflow" }} />);
    expect(screen.getByText("Prompt")).toBeInTheDocument();
  });

  it("renders callouts when present", () => {
    render(<GuideSection topic={{ ...BASE_TOPIC, callouts: ["Heads up: this is a callout."] }} />);
    expect(screen.getByText("Heads up: this is a callout.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `web/`): `npx vitest run "GuideSection"`
Expected: FAIL — `Cannot find module './GuideSection'`.

- [ ] **Step 3: Write minimal implementation**

Note: `<figure>` has an implicit ARIA role of `figure`, so `queryByRole("figure")` in the test detects whether any diagram wrapper is present — no extra `role` attribute needed on the diagram components.

Create `web/components/learn/GuideSection.tsx`:

```tsx
import { StepWalkthrough } from "./StepWalkthrough";
import { AppTypeComparisonDiagram } from "./diagrams/AppTypeComparisonDiagram";
import { VibeWorkflowDiagram } from "./diagrams/VibeWorkflowDiagram";
import { CopilotDecisionDiagram } from "./diagrams/CopilotDecisionDiagram";
import type { LearnTopic } from "@/data/learn-content";

const DIAGRAM_COMPONENTS = {
  "app-type-comparison": AppTypeComparisonDiagram,
  "vibe-workflow": VibeWorkflowDiagram,
  "copilot-decision": CopilotDecisionDiagram,
} as const;

interface GuideSectionProps {
  topic: LearnTopic;
}

export function GuideSection({ topic }: GuideSectionProps) {
  const Diagram = topic.diagram ? DIAGRAM_COMPONENTS[topic.diagram] : null;

  return (
    <section aria-labelledby={`learn-${topic.slug}-heading`}>
      <h2
        id={`learn-${topic.slug}-heading`}
        className="font-sans text-xl font-bold text-text md:text-2xl"
      >
        {topic.title}
      </h2>
      <p className="mt-2 max-w-[70ch] text-sm text-text-muted md:text-base">{topic.summary}</p>

      <div className="mt-3 rounded-lg border border-border bg-surface-elevated px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-faint">
          When to use it
        </p>
        <p className="mt-1 text-sm text-text-muted">{topic.whenToUse}</p>
      </div>

      {Diagram && (
        <div className="my-6">
          <Diagram />
        </div>
      )}

      <div className="mt-6">
        <StepWalkthrough steps={topic.steps} />
      </div>

      {topic.callouts && topic.callouts.length > 0 && (
        <div className="mt-6 space-y-2">
          {topic.callouts.map((callout) => (
            <div
              key={callout}
              className="rounded-lg border border-warning/25 bg-warning/10 px-4 py-3 text-sm text-text-muted"
            >
              {callout}
            </div>
          ))}
        </div>
      )}

      <a
        href={topic.learnMoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-block text-sm text-accent hover:underline"
      >
        {topic.learnMoreLabel} →
      </a>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `web/`): `npx vitest run "GuideSection"`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add web/components/learn/GuideSection.tsx web/components/learn/GuideSection.test.tsx
git commit -m "feat: add GuideSection component for learn catalog topics"
```

---

### Task 5: LearnTabs component

**Files:**
- Create: `web/components/learn/LearnTabs.tsx`
- Test: `web/components/learn/LearnTabs.test.tsx`

**Interfaces:**
- Consumes: `LEARN_TOPICS` (Task 1), `GuideSection` (Task 4), `FilterPills` (existing, `@/components/templates/FilterPills`)
- Produces: `LearnTabs()` — no props, named export.

- [ ] **Step 1: Write the failing test**

Create `web/components/learn/LearnTabs.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LearnTabs } from "./LearnTabs";
import { LEARN_TOPICS } from "@/data/learn-content";

describe("LearnTabs", () => {
  it("renders a tab for every topic", () => {
    render(<LearnTabs />);
    for (const topic of LEARN_TOPICS) {
      expect(screen.getByRole("button", { name: topic.title })).toBeInTheDocument();
    }
  });

  it("shows the first topic's content by default", () => {
    render(<LearnTabs />);
    expect(
      screen.getByRole("heading", { name: LEARN_TOPICS[0].title })
    ).toBeInTheDocument();
  });

  it("switches content when a different tab is selected", async () => {
    const user = userEvent.setup();
    render(<LearnTabs />);
    const secondTopic = LEARN_TOPICS[1];
    await user.click(screen.getByRole("button", { name: secondTopic.title }));
    expect(screen.getByRole("heading", { name: secondTopic.title })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `web/`): `npx vitest run "LearnTabs"`
Expected: FAIL — `Cannot find module './LearnTabs'`.

- [ ] **Step 3: Write minimal implementation**

Create `web/components/learn/LearnTabs.tsx`:

```tsx
"use client";

import { useState } from "react";
import { FilterPills } from "@/components/templates/FilterPills";
import { GuideSection } from "./GuideSection";
import { LEARN_TOPICS } from "@/data/learn-content";

export function LearnTabs() {
  const [activeSlug, setActiveSlug] = useState(LEARN_TOPICS[0].slug);
  const activeTopic = LEARN_TOPICS.find((t) => t.slug === activeSlug) ?? LEARN_TOPICS[0];

  return (
    <div>
      <div className="mb-8">
        <FilterPills
          selected={activeSlug}
          onChange={setActiveSlug}
          categories={LEARN_TOPICS.map((t) => ({ value: t.slug, label: t.title }))}
        />
      </div>
      <GuideSection topic={activeTopic} />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `web/`): `npx vitest run "LearnTabs"`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add web/components/learn/LearnTabs.tsx web/components/learn/LearnTabs.test.tsx
git commit -m "feat: add LearnTabs tab switcher for the learn catalog"
```

---

### Task 6: /learn page route

**Files:**
- Create: `web/app/learn/page.tsx`
- Test: `web/__tests__/app/learn/page.test.tsx`

**Interfaces:**
- Consumes: `LearnTabs` (Task 5), `PageTransition` (existing, `@/components/layout/PageTransition`), `PageEyebrow` (existing, `@/components/layout/PageEyebrow`)
- Produces: default export `LearnPage()` at route `/learn`.

- [ ] **Step 1: Write the failing test**

Create `web/__tests__/app/learn/page.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LearnPage from "@/app/learn/page";

describe("LearnPage", () => {
  it("renders the page heading", () => {
    render(<LearnPage />);
    expect(screen.getByRole("heading", { name: "Learn Power Platform", level: 1 })).toBeInTheDocument();
  });

  it("renders the tab switcher with the first topic visible", () => {
    render(<LearnPage />);
    expect(screen.getByRole("heading", { name: "Canvas apps", level: 2 })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `web/`): `npx vitest run "LearnPage"`
Expected: FAIL — `Cannot find module '@/app/learn/page'`.

- [ ] **Step 3: Write minimal implementation**

Create `web/app/learn/page.tsx`:

```tsx
"use client";

import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { PageTransition } from "@/components/layout/PageTransition";
import { LearnTabs } from "@/components/learn/LearnTabs";

export default function LearnPage() {
  return (
    <PageTransition>
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
        <PageEyebrow path="learn" />
        <header className="mb-8">
          <h1 className="font-sans text-2xl font-bold text-text md:text-3xl">
            Learn Power Platform
          </h1>
          <p className="mt-2 max-w-[60ch] text-sm text-text-muted md:text-base">
            Step-by-step guides for building apps and AI agents — no prior experience needed.
          </p>
        </header>
        <LearnTabs />
      </div>
    </PageTransition>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `web/`): `npx vitest run "LearnPage"`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add web/app/learn/page.tsx web/__tests__/app/learn/page.test.tsx
git commit -m "feat: add /learn page route"
```

---

### Task 7: Wire up the "Learn" nav link

**Files:**
- Modify: `web/components/layout/Navbar.tsx:10-13`
- Modify (test): `web/__tests__/components/layout/Navbar.test.tsx:43-47`

**Interfaces:**
- Consumes: nothing new — this only adds a nav entry pointing at the route from Task 6.
- Produces: nothing new — `Navbar`'s public interface (`NavbarProps`) is unchanged.

- [ ] **Step 1: Update the failing test first**

In `web/__tests__/components/layout/Navbar.test.tsx`, replace the `"renders Home and Templates nav links"` test:

```tsx
  it("renders Home, Templates, and Learn nav links", () => {
    render(<Navbar />);
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Learn" })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `web/`): `npx vitest run "Navbar"`
Expected: FAIL — no link with name "Learn".

- [ ] **Step 3: Add the nav link**

In `web/components/layout/Navbar.tsx`, update the `navLinks` array (lines 10-13):

```ts
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/templates", label: "Templates" },
  { href: "/learn", label: "Learn" },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `web/`): `npx vitest run "Navbar"`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add web/components/layout/Navbar.tsx web/__tests__/components/layout/Navbar.test.tsx
git commit -m "feat: add Learn link to main navigation"
```

---

### Task 8: Full quality gate

**Files:** none (verification only)

- [ ] **Step 1: Run the full web test suite**

Run (from `web/`): `npx vitest run`
Expected: all tests pass, including the new ones from Tasks 1–7.

- [ ] **Step 2: Type-check**

Run (from `web/`): `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Lint**

Run (from `web/`): `npm run lint`
Expected: 0 errors.

- [ ] **Step 4: Build**

Run (from `web/`): `npm run build`
Expected: build succeeds, `.next/` produced, `/learn` listed among the generated routes.

- [ ] **Step 5: Manual smoke check**

Run (from `web/`): `$env:NODE_OPTIONS="--use-system-ca"; npm run dev`, open `http://localhost:3000/learn`, click through all 5 tabs, confirm each renders its steps and (where applicable) its diagram, then stop the dev server.

No commit for this task — it's verification of the work already committed in Tasks 1–7. If any step fails, fix the issue in the relevant task's files and re-run the gate.
