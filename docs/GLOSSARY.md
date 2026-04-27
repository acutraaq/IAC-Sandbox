# Domain Glossary

> **Version:** 1.0.0 | **Last updated:** 2026-04-26 | **Status:** Active

Definitions of project-specific and Azure-specific terms used throughout IAC Sandbox documentation and code.

---

## A

### **Accepted** (status)
Deployment has been submitted and enqueued but the ARM deployment has not yet been created. This is the initial state returned by the status endpoint if the ARM deployment does not yet exist.

See also: [Status Lifecycle](project/SPEC.md#data-model-v2)

### **ARM** / **Azure Resource Manager**
Microsoft's infrastructure-as-code service that defines, deploys, and manages Azure resources. In IAC Sandbox, ARM is the source of truth for all deployment state.

See also: [ARM Deployment Execution (SPEC.md Section 12)](project/SPEC.md#12-arm-deployment-execution-v2)

### **ARM Deployment**
An ARM operation that creates or updates resources within a resource group. Named by `submissionId` in IAC Sandbox to enable status lookups.

### **ARM Tag**
Metadata key-value pairs attached to Azure resources or resource groups for tracking, billing, compliance. IAC Sandbox applies 6 tags to every deployment:
- `Cost Center` (policy-required)
- `Project ID` (policy-required)
- `Project Owner` (policy-required)
- `Expiry Date` (policy-required)
- `deployedBy` (app-set; hardcoded to `demo@sandbox.local` until SSO)
- `iac-submissionId` (app-set; for status back-lookup)

See also: [ARM Resource Group Tags (SPEC.md Section 9)](project/SPEC.md#arm-resource-group-tags-per-deployment)

---

## B

### **Bicep**
Declarative domain-specific language for defining Azure resources. Originally planned but superseded by ARM SDK in v2.

See also: [ADR-017 (SPEC.md)](project/SPEC.md#adr-017-azure-functions-v4-for-async-arm-execution-v2)

---

## C

### **Cost Center**
Policy-required tag identifying the cost allocation for a deployment. Format defined by organizational cost allocation policy.

See also: [ARM Tags](#arm-tag)

---

## D

### **Deployment**
A user request to create or modify Azure infrastructure via IAC Sandbox. Expressed as either:
- **Template mode** — predefined template with user form inputs
- **Custom mode** — user-selected resources with per-resource configuration

Deployments are submitted via `POST /api/deployments`, enqueued, and executed asynchronously by an Azure Function.

See also: [Functional Requirements (SPEC.md Section 5)](project/SPEC.md#functional-requirements)

### **Deployable Slug**
A template slug that is permitted for deployment. Maintained in the allow-list `DEPLOYABLE_SLUGS` in `web/lib/deployments/policy.ts`.

See also: [Template Catalog (CLAUDE.md)](../CLAUDE.md#template-catalog)

### **DeployedBy Tag**
ARM tag identifying the user who submitted the deployment. Currently hardcoded to `demo@sandbox.local` until Microsoft SSO is configured.

---

## E

### **Entra ID** / **Microsoft Entra**
Microsoft's identity and access management service (formerly Azure AD). Planned for SSO integration.

See also: [Authentication and Identity (SPEC.md Section 11)](project/SPEC.md#11-authentication-and-identity)

---

## F

### **Failed** (status)
ARM deployment has completed but failed. Error details are available via ARM operation logs.

See also: [Status Lifecycle](project/SPEC.md#status-lifecycle)

### **Function App**
Azure Functions service that runs the queue-triggered `processDeployment` handler. Executes ARM deployments asynchronously.

See also: [Azure Functions Architecture (CLAUDE.md)](../CLAUDE.md#live-deployment)

---

## H

### **HOD** / **Head of Department**
External reviewer role who receives the proof artifact for manual approval outside the system.

See also: [Personas (SPEC.md Section 3)](project/SPEC.md#3-personas)

---

## I

### **IAC** / **Infrastructure as Code**
Practice of defining infrastructure (networks, storage, compute) using code and version control rather than manual provisioning. IAC Sandbox is an infrastructure-as-code deployment platform.

### **Idempotent** / **Idempotency**
Operation that can be repeated multiple times without changing the result beyond the initial application. Resource group and deployment creation in IAC Sandbox is idempotent.

---

## J

### **JWT** / **JSON Web Token**
Digitally signed credential format used for bearer token authentication. Frontend passes JWT to backend API routes; backend validates signature, issuer, audience, tenant.

See also: [Authentication (SPEC.md Section 11)](project/SPEC.md#11-authentication-and-identity)

---

## M

### **Managed Identity**
Azure credential mechanism that avoids storing secrets in code. App Service and Function App use managed identities for Azure API access.

See also: [Authentication (SPEC.md Section 12)](project/SPEC.md#12-arm-deployment-execution-v2)

### **MSAL** / **Microsoft Authentication Library**
JavaScript library for authenticating users via Microsoft Entra ID. Planned for frontend SSO integration (currently blocked on admin credentials).

See also: [HANDOFF.md — Still blocked](superpowers/HANDOFF.md#still-blocked)

---

## P

### **Policy Tags**
Required ARM tags enforced by Azure subscription policy. In IAC Sandbox: `Cost Center`, `Project ID`, `Project Owner`, `Expiry Date`.

See also: [ARM Tags](#arm-tag)

### **Policy-Blocked** (template)
Template slug that users are not permitted to deploy (enforced server-side). Currently: `virtual-machine`, `microservices-platform`, `data-pipeline`, `secure-api-backend`.

See also: [Template Catalog (CLAUDE.md)](../CLAUDE.md#template-catalog)

### **Proof** / **Proof Artifact**
Plain-text copyable document generated after successful submission. Contains submission ID, submitter identity, timestamp, configuration, and status. Users send this to HOD for manual approval.

See also: [Proof Artifact Format (SPEC.md Section 13)](project/SPEC.md#13-proof-artifact-format)

---

## Q

### **Queue** / **Deployment Queue**
Azure Storage Queue (`deployment-jobs`) that decouples submission from execution. `POST /api/deployments` enqueues a message; Azure Function picks it up and executes the deployment.

See also: [Async Deployment Execution (SPEC.md Section 12)](project/SPEC.md#12-arm-deployment-execution-v2)

---

## R

### **Resource**
An Azure entity (e.g., storage account, virtual machine, key vault). Defined by type (e.g., `Microsoft.Storage/storageAccounts`) and configuration.

### **Resource Group** / **RG**
Container in Azure that holds related resources. All resources deployed by IAC Sandbox are created in a resource group. The RG name is derived from the deployment template slug and timestamp.

See also: [RG Naming (CLAUDE.md)](../CLAUDE.md#directory-layout)

### **Running** (status)
ARM deployment is in progress. Resources are being created or updated.

See also: [Status Lifecycle](project/SPEC.md#status-lifecycle)

---

## S

### **Slug** / **Template Slug**
URL-friendly identifier for a template (e.g., `web-application`, `storage-account`). Used in `/templates/[slug]` routes and in deployment payloads.

See also: [Template Catalog (CLAUDE.md)](../CLAUDE.md#template-catalog)

### **SSO** / **Single Sign-On**
Authentication mechanism where users sign in once and gain access to multiple related systems. Planned via Microsoft Entra ID; currently placeholder login.

See also: [HANDOFF.md — Phase 1 (Login Placeholder)](superpowers/HANDOFF.md#phase-1-deliverables-all-in-pr-6)

### **Submission**
A user's deployment request, identified by a unique `submissionId`. Contains mode, template or resources, and policy tags. Submitted via `POST /api/deployments`.

### **SubmissionId**
UUID generated per deployment submission. Used as the ARM deployment name, enabling status lookups. Included in the proof artifact and ARM tags for back-reference.

See also: [Proof Artifact Format (SPEC.md Section 13)](project/SPEC.md#13-proof-artifact-format)

### **Succeeded** (status)
ARM deployment has completed successfully. All resources have been created.

See also: [Status Lifecycle](project/SPEC.md#status-lifecycle)

---

## T

### **Tag** / **Tagging**
See [ARM Tag](#arm-tag) and [Policy Tags](#policy-tags).

### **Template**
Predefined infrastructure configuration that users can customize via form fields. Includes metadata (name, icon, category), step-by-step wizard, and ARM resource definitions.

See also: [Template Catalog (CLAUDE.md)](../CLAUDE.md#template-catalog)

### **Tenant** / **Azure Tenant**
Azure AD tenant (organization) containing subscriptions and users. IAC Sandbox is single-tenant by design.

---

## U

### **Undeployed RG** (custom request mode)
In `/request` flow, the user picks resources, generates a copy-paste request document, and emails it to the IAC team for manual provisioning. The RG is not auto-created.

See also: [Custom Request Flow (CLAUDE.md)](../CLAUDE.md#project-overview)

---

## Z

### **Zustand**
Lightweight state management library for React. IAC Sandbox uses a single `deploymentStore` for cross-route state.

See also: [State Management (SPEC.md Section 7)](project/SPEC.md#state-model-v2)

---

## Cross-Reference Index

### **By Azure Concept**
- [ARM](#arm--azure-resource-manager)
- [Resource Group](#resource-group--rg)
- [Managed Identity](#managed-identity)
- [ARM Tag](#arm-tag)
- [Entra ID](#entra-id--microsoft-entra)

### **By Deployment Concept**
- [Deployment](#deployment)
- [Submission](#submission)
- [SubmissionId](#submissionid)
- [Proof](#proof--proof-artifact)
- [Status Lifecycle](#status-lifecycle-accepted-running-succeeded-failed)

### **By System Component**
- [Function App](#function-app)
- [Queue](#queue--deployment-queue)
- [Template](#template)
- [Resource](#resource)

### **By Role**
- [HOD](#hod--head-of-department)
- [SSO](#sso--single-sign-on)
- [MSAL](#msal--microsoft-authentication-library)

---

## See Also

- [Complete Specification](project/SPEC.md)
- [Project Conventions (CLAUDE.md)](../CLAUDE.md)
- [Documentation Index](README.md)
