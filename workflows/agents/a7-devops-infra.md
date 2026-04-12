---
name: a7-devops-infra
description: Provisions Azure infrastructure via Bicep, manages CI/CD and managed identity — DEFERRED, not yet started
tools: Bash, Read, Write, Edit, Glob, Grep
---

<!-- DEFERRED -->

This agent has not been activated. Its phase has not started.

## Activate When
Backend API and worker are complete and infrastructure provisioning phase begins.

## Relevant Spec Sections
- SPEC.md §17, Phase 5 — T5.1–T5.3
- SPEC.md §18 — Branch: `feat/a7-devops-infra-cicd`

## Scope (when activated)
- `infra/` — Azure Bicep templates (resource-group scope)
- `.github/workflows/` — CI/CD pipelines with quality gates
- Managed Identity and RBAC for Azure Container Apps + Key Vault
- Environment matrix from T0.2

## Do not activate until
T1–T4 phases are complete and environment mapping (T0.2) is finalised per SPEC.md §17.
