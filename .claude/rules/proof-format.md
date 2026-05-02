---
description: Proof artifact format for sandbox deployment confirmations — required exact output for generateReport
globs: web/components/review/**, web/lib/report.ts
---

# Proof Artifact Format

`generateReport` in `web/lib/report.ts` must produce exactly this format:

```
SANDBOX DEPLOYMENT PROOF
========================
Submission ID : <submissionId>
Submitted By  : <name> (<email>)
Tenant        : <tenantId>
Date/Time     : <locale-formatted, en-MY>
Mode          : Template | Custom
Target Sub    : <subscription>
Target RG     : <resource-group>
Status        : accepted | running | succeeded | failed

Selection:
- Template: <slug/name>
  Form Values:
    <key>: <value>
or
- Resource 1: <type> — <name>
  Config: <key>: <value>

Note: Manual HOD approval is required outside this system.
```
