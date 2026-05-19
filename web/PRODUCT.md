# IAC Sandbox — PRODUCT.md

## Register
**Product** — authenticated tool UI. Design serves the task. Users are in flow; they don't want choreography.

## Users
EPF (Employees Provident Fund, Malaysia) internal staff. Non-technical. They need Azure cloud resources but have no ARM template knowledge. Their context: office environment, standard corporate monitor, mid-day usage, task-focused workflow. They fill in a form, they want their resources — not a product tour.

## Product Purpose
Internal Azure Infrastructure-as-Code deployment platform. Three flows:
- **Template flow**: guided wizard over 16 ARM templates across 7 categories
- **Custom builder**: resource-by-resource configuration (auto-deploys)
- **Custom request**: generates a copy-paste document for manual HOD approval (no deploy)

Submission -> queue -> Azure Function -> ARM deployment via managed identity. HOD approval is manual and outside the system.

## Brand Personality
Technical. Precise. Minimal. Engineering-native. The interface should feel like a well-maintained internal tool — not a SaaS landing page that got themed dark. No delight for its own sake. No friendly marketing language. Trust through clarity, not warmth.

## Anti-References
- Consumer SaaS (gradients, hero metrics, feature marketing, mascots)
- Azure Portal-style heavy UI (too many panels, too much chrome)
- Neon cyberpunk aesthetics (too aggressive for corporate internal tool)
- Over-animated dashboards (motion should be invisible)

## Accessibility Needs
Corporate workforce — may include older users unfamiliar with dense UI. Standard WCAG AA minimum. Keyboard navigation required. Focus states must be visible. Form labels always visible (not placeholder-only).

## Strategic Design Principles
1. The form IS the product — every wizard step and tag field must be frictionless
2. State vocabulary over decoration — hover, active, error, success, loading are the design language
3. Familiar affordances — don't reinvent buttons, modals, or forms
4. Proof artifact (the copy-paste HOD approval text) is a first-class deliverable — style it accordingly
5. Deployment status = anxiety moment — the review/confirm flow needs calm, clear progress signals
