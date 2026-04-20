---
name: smoke
description: Manual smoke test checklist for IAC Sandbox — run after build to verify both deployment flows end-to-end
---

# Smoke Test Checklist

## Overview
Manual browser verification of both user flows end-to-end. Every checkbox must be ticked before a phase is considered done. Run after a successful build with the dev server live.

## Quick Reference
| Task | Command |
|---|---|
| Start dev server | `cd frontend && npm run dev` |
| Open app | http://localhost:3000 |

Start the dev server first:
```bash
cd frontend && npm run dev
```

Open **http://localhost:3000** and work through this checklist. Check each item only when verified in the browser.

## Template Flow
- [ ] Home page loads — hero and CTAs visible, no console errors
- [ ] Click "Browse Templates" → `/templates` loads with 8 template cards
- [ ] Filter pills filter the grid by category; "All" resets to show all 8
- [ ] Click a template card → `/templates/[slug]` loads the wizard
- [ ] Stepper shows the correct number of steps for the selected template
- [ ] Fill in all fields — SummaryPanel updates in real time
- [ ] Complete wizard → redirected to `/review`
- [ ] ReviewSection shows the template name and all filled values
- [ ] Click Submit → spinner appears on button, then ConfirmModal opens
- [ ] Proof text in modal matches the format from CLAUDE.md §Proof Artifact Format
- [ ] Copy button writes text to clipboard
- [ ] Close modal → back on review page, no errors

## Custom Builder Flow
- [ ] Navigate to `/builder` — all 8 resource types visible
- [ ] Click a resource → ResourceDrawer slides in from right
- [ ] Fill in config fields; validation prevents empty required fields
- [ ] Close drawer → resource appears in SelectedPanel
- [ ] Attempt to add the same resource type again → blocked (no duplicate added)
- [ ] Navigate to `/review` — added resources listed correctly
- [ ] Submit → ConfirmModal opens with proof text
- [ ] Copy button works

## Cross-Cutting
- [ ] Theme toggle (nav, top-right) switches dark ↔ light
- [ ] Reload page — theme persists (verify `sandbox-theme` key in localStorage)
- [ ] All modals: pressing Escape closes them
- [ ] All interactive cards: Enter and Space activate them
- [ ] DevTools Console: zero errors on any of the above paths
