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
