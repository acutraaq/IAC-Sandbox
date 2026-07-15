---
name: smoke
description: Manual smoke test checklist for IAC Sandbox — run after build to verify the Template deployment flow end-to-end
---

# Smoke Test Checklist

## Overview
Manual browser verification of the Template flow — the only deployment flow reachable from the UI (Custom Builder and Custom Request frontends were removed; see CLAUDE.md Project Overview). Every checkbox must be ticked before a phase is considered done. Run after a successful build with the dev server live.

## Quick Reference
| Task | Command |
|---|---|
| Start dev server | `cd web && npm run dev` |
| Open app | http://localhost:3000 |

Start the dev server first:
```bash
cd web && npm run dev
```

Open **http://localhost:3000** and work through this checklist. Check each item only when verified in the browser.

## Template Flow
- [ ] Home page loads — hero and CTAs visible, no console errors
- [ ] Click through to `/templates` → loads with 2 template cards (`logic-app`, `logic-app-storage`), both automation category
- [ ] Click a template card → `/templates/[slug]` loads the wizard
- [ ] Stepper shows the correct number of steps for the selected template
- [ ] Fill in all fields — SummaryPanel updates in real time
- [ ] Complete wizard → redirected to `/review`
- [ ] ReviewSection shows the template name and all filled values
- [ ] Click Submit → spinner appears on button, then ConfirmModal opens
- [ ] ConfirmModal shows the proof artifact only — no progress timeline (deliberately removed, see CLAUDE.md Architecture)
- [ ] Proof text in modal matches the format from CLAUDE.md §Proof Artifact Format
- [ ] Copy button writes text to clipboard
- [ ] Close modal → back on review page; the page silently polls `GET /api/deployments/:id` in the background (no visible change unless the deployment fails)

## Cross-Cutting
- [ ] App is dark-only — no theme toggle exists; do not add this check unless CLAUDE.md documents one
- [ ] All modals: pressing Escape closes them
- [ ] All interactive cards: Enter and Space activate them
- [ ] DevTools Console: zero errors on any of the above paths
