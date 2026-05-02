# Product

## Register

product

## Users

Non-technical project staff at EPF (Employees Provident Fund, Malaysia) — business and project owners who need Azure cloud resources provisioned for their projects but do not manage infrastructure themselves. Occasional users; they may open the tool once per project, not daily. They understand what they need (storage, a database, a web app) but not how Azure works under the hood. A HOD approver may also review the generated proof document outside the system.

## Product Purpose

Sandbox IAC is an internal Azure Infrastructure-as-Code deployment platform. It abstracts away ARM and Azure Portal complexity so non-expert EPF staff can configure and submit Azure infrastructure deployments in minutes. Three flows: Template (wizard using predefined templates), Custom Builder (resource-by-resource configuration), and Custom Request (copy-paste document sent to the IAC team for manual provisioning after HOD approval). ARM is the source of truth — no database.

## Brand Personality

Clear, guided, trustworthy. The tool should feel like a knowledgeable colleague walking you through a process — calm, structured, never overwhelming. References: Vercel Dashboard for typographic hierarchy and clean confidence; Notion for approachability and readability with a mixed-technical audience.

## Anti-references

- **Generic SharePoint / intranet** — boxy, low-density, corporate blue, form-from-2012 energy.
- **Dense AWS console** — overwhelming navigation, too many options surfaced at once. This tool exists precisely to abstract that away.
- **Flashy SaaS marketing** — gradients, glassmorphism, hero metrics, decorative animation. Performative, not trustworthy.
- **Neon / cyberpunk dark** — glowing neons on black. Wrong register for a government-adjacent enterprise tool.

## Design Principles

1. **Clarity over density.** Surface only what's needed for this step. Infrastructure complexity lives in the backend — it must not leak into the UI.
2. **Guide, don't gatekeep.** Every screen should make the next action obvious. Non-technical users should never feel stuck or unsure what to do next.
3. **Earn trust through precision.** Correct labels, honest status, no false confidence. Infrastructure has real consequences — the UI must reflect that gravity without inducing anxiety.
4. **Restrained by default.** Dark, structured, professional. Decoration earns its place only when it aids comprehension or reduces cognitive load.
5. **Consistent affordances across flows.** Template, Builder, and Request flows feel like one coherent system. Similar actions look and behave the same regardless of which flow the user entered.

## Accessibility & Inclusion

WCAG 2.1 AA. Keyboard navigation throughout. Screen reader support with ARIA labels and `role` attributes. Reduced-motion safe animations (all keyframes respect `prefers-reduced-motion`). High-contrast text on all interactive states.
