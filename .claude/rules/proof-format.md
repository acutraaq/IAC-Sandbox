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
Submitted By  : <displayName> (<upn>)
Tenant        : <tenantId>
Date/Time     : <locale-formatted, en-MY>
Mode          : Template | Custom
Target Sub    : sub-epf-sandbox-internal
Target RG     : <resource-group>
Status        : accepted

Tags:
  Cost Center  : <value>
  Project ID   : <value>
  Project Owner: <value>
  Expiry Date  : <value>

Selection:
- Template: <name>
  Configuration:
    <key>: <value>
or
- Resource 1: <name>
  Configuration:
    <key>: <value>

Note: Manual HOD approval is required outside this system.
```
