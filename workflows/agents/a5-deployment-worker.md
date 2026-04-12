---
name: a5-deployment-worker
description: Implements Bicep adapter, async deployment execution, and status updates — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Backend API (A4) is complete and Bicep execution pipeline phase begins.

## Relevant Spec Sections
- SPEC.md §12 — Bicep Deployment Execution
- SPEC.md §17, Phase 4 — T4.1–T4.3
- SPEC.md §18 — Branch: `feat/a5-worker-bicep-execution`

## Scope (when activated)
- `backend/` (worker module) — Bicep adapter, async queue, status updates
- Translates API payload → Bicep parameter files
- Polls/updates deployment status: accepted → running → succeeded/failed

## Do not activate until
T3.1 and T3.2 (backend API + persistence) are complete per SPEC.md §17.
