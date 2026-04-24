---
name: arch-file
description: Enforce the structured file-creation output format — filepath, purpose, dependencies, consumers, and tests — before writing any new file
---

# Architectural File Creation Format

## When to Use
Invoke `/arch-file` before creating any new source file. This enforces the discipline of declaring where a file lives and why, before writing a single line of code.

## Output Format

Produce this block for every new file before writing its implementation:

```
📁 <filepath relative to repo root>
Purpose: <one sentence — what this file does, not how>
Depends on: <imports this file consumes>
Used by: <files or routes that import this file>
```

Then write the implementation. After the implementation, append:

```
Tests: <what to test — specific behaviours, not "test the function">
```

## Example

```
📁 web/lib/deployments/cost-estimate.ts
Purpose: Derives a monthly cost estimate from a set of ARM resource definitions.
Depends on: web/types/index.ts (ResourceConfig), web/lib/deployments/schema.ts (resourceSchema)
Used by: web/app/review/page.tsx, web/components/review/CostPanel.tsx
```

```typescript
// implementation here
```

```
Tests:
- returns 0 for an empty resource list
- sums per-resource estimates correctly
- returns null when a resource type has no known estimate (not an error)
```

## Rules
- `Purpose` must describe the WHY, not restate the filename
- `Depends on` must list actual import paths, not vague descriptions
- `Used by` must name real files that will import this — if unknown, write `TBD — verify before merging`
- `Tests` must be specific behaviours, not method names
- Never skip this format for files that introduce new logic, new types, or new API surface
- Skip this format only for config-only files (e.g., `tailwind.config.ts`, `vitest.config.ts`) where there is no logic to reason about
