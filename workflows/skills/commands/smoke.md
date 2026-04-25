---
name: smoke
description: Manual smoke test checklist for IAC Sandbox — run after build to verify all three deployment flows end-to-end
---

# Smoke Test Checklist

## Overview
Manual browser verification of all three user flows end-to-end. Every checkbox must be ticked before a phase is considered done. Run after a successful build with the dev server live.

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
- [ ] Click "Browse Templates" → `/templates` loads with 16 template cards
- [ ] Filter pills filter the grid by category; "All" resets to show all 16
- [ ] Policy-blocked templates (e.g. Virtual Machine) show a lock indicator and are not clickable
- [ ] Click a non-blocked template card → `/templates/[slug]` loads the wizard
- [ ] Stepper shows the correct number of steps for the selected template
- [ ] Fill in all fields — SummaryPanel updates in real time
- [ ] Complete wizard → redirected to `/review`
- [ ] ReviewSection shows the template name and all filled values
- [ ] Click Submit → spinner appears on button, then ConfirmModal opens
- [ ] ConfirmModal shows 3-step timeline: Submitted → Deploying → Complete
- [ ] Proof text in modal matches the format from CLAUDE.md §Proof Artifact Format
- [ ] Copy button writes text to clipboard
- [ ] On succeeded: "View in Azure Portal" deep-link to resource group is visible
- [ ] Close modal → back on review page, no errors

## Custom Builder Flow
- [ ] Navigate to `/builder` — resource types visible
- [ ] Click a resource → ResourceDrawer slides in from right
- [ ] Fill in config fields; validation prevents empty required fields
- [ ] Close drawer → resource appears in SelectedPanel
- [ ] Attempt to add the same resource type again → blocked (no duplicate added)
- [ ] Navigate to `/review` — added resources listed correctly
- [ ] Submit → ConfirmModal opens with proof text and 3-step timeline
- [ ] Copy button works

## Custom Request Flow
- [ ] Navigate to `/request` — resource picker loads, no console errors
- [ ] Select one or more resources → request document renders with all selections
- [ ] Copy button writes the full request document to clipboard
- [ ] No API call is made (check Network tab — no POST to `/api/deployments`)
- [ ] Navigating away and back resets the request state correctly

## My Stuff
- [ ] Navigate to `/my-stuff` — page loads without errors
- [ ] Deployed resource groups tagged `deployedBy: demo@sandbox.local` are listed
- [ ] Each item shows resource group name, status badge, and timestamp

## Cross-Cutting
- [ ] Theme toggle (nav, top-right) switches dark ↔ light
- [ ] Reload page — theme persists (verify `sandbox-theme` key in localStorage)
- [ ] All modals: pressing Escape closes them
- [ ] All interactive cards: Enter and Space activate them
- [ ] DevTools Console: zero errors on any of the above paths
