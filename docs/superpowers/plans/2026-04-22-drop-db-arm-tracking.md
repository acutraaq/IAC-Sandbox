# Drop PostgreSQL — ARM-Native Deployment Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove PostgreSQL/Prisma entirely and replace with ARM as the source of truth for deployment status, plus a new "My Stuff" page listing the user's resource groups from ARM.

**Architecture:** On submission, generate a `submissionId` (UUID) in the API route and enqueue it — no DB write. The Function App uses that ID as the ARM deployment name, and tags the resource group with `deployedBy` and `iac-submissionId`. Status is polled by querying `ARM deployments.get(rg, submissionId)`. "My Stuff" lists ARM resource groups filtered by `deployedBy` tag.

**Tech Stack:** Next.js 16 App Router, Azure Functions v4, `@azure/arm-resources`, `@azure/identity`, `DefaultAzureCredential`, Zustand, Vitest

**Auth note:** `deployedBy` is hardcoded to `"demo@sandbox.local"` throughout this plan (matching the existing stub). Replace with real UPN when MSAL auth lands.

---

## File Map

### Created
- `web/lib/deployments/arm-status.ts` — pure function: maps ARM provisioningState → our DeploymentStatus
- `web/lib/arm.ts` — factory function returning `ResourceManagementClient` per request
- `web/app/api/my-deployments/route.ts` — GET: list ARM RGs tagged with `deployedBy`
- `web/app/my-stuff/page.tsx` — "My Stuff" page UI
- `web/__tests__/lib/deployments/arm-status.test.ts` — unit tests for arm-status helper
- `web/__tests__/app/my-stuff/page.test.tsx` — basic render test for My Stuff page

### Modified
- `web/lib/server-env.ts` — remove `DATABASE_URL`
- `web/lib/api.ts` — update `getDeployment(submissionId, resourceGroup)` signature; replace `listDeployments` with `listMyDeployments`
- `web/types/index.ts` — add `resourceGroup` to `SubmitResponse`; add `deployedResourceGroup` to `DeploymentState`; replace `DeploymentListItem` with `MyDeploymentItem`; update store action signature
- `web/store/deploymentStore.ts` — add `deployedResourceGroup: string | null` field; update `setSubmissionResult` to accept `resourceGroup`; include in `reset`
- `web/app/api/deployments/route.ts` — POST: remove DB create, generate submissionId via `crypto.randomUUID()`, return `{ submissionId, resourceGroup }`; delete GET handler
- `web/app/api/deployments/[submissionId]/route.ts` — GET: remove DB lookup, query ARM `deployments.get(rg, submissionId)` via `?rg=` query param
- `web/app/review/page.tsx` — read `deployedResourceGroup` from store; pass it to `getDeployment`; update `setSubmissionResult` call to include `resourceGroup`
- `web/components/layout/Sidebar.tsx` — change "My stuff" href from `/templates` to `/my-stuff`
- `web/package.json` — add `@azure/arm-resources`, `@azure/identity`; remove `@prisma/client`, `prisma`
- `web/__tests__/store/deploymentStore.test.ts` — update `setSubmissionResult` call to include resourceGroup; add test for new field
- `web/__tests__/app/review/page.test.tsx` — update mock submit response to include `resourceGroup`; update mock call signature awareness
- `functions/src/lib/env.ts` — remove `DATABASE_URL` from Zod schema
- `functions/src/modules/deployments/bicep-executor.ts` — add `deployedBy` and `iac-submissionId` tags to RG `createOrUpdate` call
- `functions/src/functions/processDeployment.ts` — remove `updateDeploymentStatus` calls and `db.$disconnect()`
- `functions/package.json` — remove `@prisma/client`, `prisma`
- `.github/workflows/ci.yml` — remove `npx prisma generate` steps; remove `DATABASE_URL` dummy env from build step

### Deleted
- `web/lib/db.ts`
- `web/prisma/schema.prisma`
- `functions/src/lib/db.ts`
- `functions/src/modules/deployments/deployment.repo.ts`
- `docker-compose.yml`

---

## Task 1: Add ARM packages to web and remove Prisma packages

**Files:**
- Modify: `web/package.json`

- [ ] **Step 1: Install ARM packages**

```bash
cd web && npm install @azure/arm-resources @azure/identity
```

Expected: updated `web/package.json` dependencies with `@azure/arm-resources` and `@azure/identity`.

- [ ] **Step 2: Remove Prisma packages**

```bash
npm uninstall @prisma/client prisma
```

Expected: `@prisma/client` removed from `dependencies`, `prisma` removed from `devDependencies`.

- [ ] **Step 3: Verify package.json**

Open `web/package.json` and confirm:
- `@azure/arm-resources` present in `dependencies`
- `@azure/identity` present in `dependencies`
- `@prisma/client` absent
- `prisma` absent

- [ ] **Step 4: Remove Prisma from functions**

```bash
cd ../functions && npm uninstall @prisma/client prisma
```

Expected: both removed from `functions/package.json`.

- [ ] **Step 5: Commit**

```bash
cd .. && git add web/package.json web/package-lock.json functions/package.json functions/package-lock.json
git commit -m "chore: swap Prisma for Azure ARM SDK in web; remove Prisma from functions"
```

---

## Task 2: Create ARM status helper (TDD)

**Files:**
- Create: `web/lib/deployments/arm-status.ts`
- Create: `web/__tests__/lib/deployments/arm-status.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `web/__tests__/lib/deployments/arm-status.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { mapArmProvisioningState } from "@/lib/deployments/arm-status";

describe("mapArmProvisioningState", () => {
  it("returns accepted for undefined state", () => {
    expect(mapArmProvisioningState(undefined)).toBe("accepted");
  });

  it("returns accepted for empty string", () => {
    expect(mapArmProvisioningState("")).toBe("accepted");
  });

  it("returns succeeded for Succeeded", () => {
    expect(mapArmProvisioningState("Succeeded")).toBe("succeeded");
  });

  it("returns failed for Failed", () => {
    expect(mapArmProvisioningState("Failed")).toBe("failed");
  });

  it("returns failed for Canceled", () => {
    expect(mapArmProvisioningState("Canceled")).toBe("failed");
  });

  it("returns running for Running", () => {
    expect(mapArmProvisioningState("Running")).toBe("running");
  });

  it("returns running for Accepted (ARM queued state)", () => {
    expect(mapArmProvisioningState("Accepted")).toBe("running");
  });

  it("returns running for any other unrecognised state", () => {
    expect(mapArmProvisioningState("Deleting")).toBe("running");
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd web && npx vitest run __tests__/lib/deployments/arm-status.test.ts
```

Expected: FAIL — `Cannot find module '@/lib/deployments/arm-status'`

- [ ] **Step 3: Implement the helper**

Create `web/lib/deployments/arm-status.ts`:

```ts
import type { DeploymentStatus } from "@/types";

export function mapArmProvisioningState(state: string | undefined): DeploymentStatus {
  if (!state) return "accepted";
  const lower = state.toLowerCase();
  if (lower === "succeeded") return "succeeded";
  if (lower === "failed" || lower === "canceled") return "failed";
  return "running";
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run __tests__/lib/deployments/arm-status.test.ts
```

Expected: PASS — 8 tests

- [ ] **Step 5: Commit**

```bash
git add web/lib/deployments/arm-status.ts web/__tests__/lib/deployments/arm-status.test.ts
git commit -m "feat: add ARM provisioning state mapper helper"
```

---

## Task 3: Create ARM client factory

**Files:**
- Create: `web/lib/arm.ts`

- [ ] **Step 1: Create the ARM client factory**

Create `web/lib/arm.ts`:

```ts
import { ResourceManagementClient } from "@azure/arm-resources";
import { DefaultAzureCredential } from "@azure/identity";
import { serverEnv } from "@/lib/server-env";

export function getArmClient(): ResourceManagementClient {
  return new ResourceManagementClient(
    new DefaultAzureCredential(),
    serverEnv.AZURE_SUBSCRIPTION_ID
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: 0 errors (DATABASE_URL still in serverEnv at this point — that's fine).

- [ ] **Step 3: Commit**

```bash
git add web/lib/arm.ts
git commit -m "feat: add ARM client factory using DefaultAzureCredential"
```

---

## Task 4: Update shared types

**Files:**
- Modify: `web/types/index.ts`

- [ ] **Step 1: Update types**

Replace the entire contents of `web/types/index.ts` with:

```ts
/* ── Field Schema (dynamic form fields) ── */

export interface FieldSchema {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "toggle";
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
}

/* ── Templates ── */

export interface TemplateStep {
  title: string;
  description: string;
  fields: FieldSchema[];
}

export interface Template {
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  resourceCount: number;
  estimatedTime: string;
  steps: TemplateStep[];
  policyBlocked?: boolean;
}

/* ── Resources (custom builder) ── */

export interface AzureResource {
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  fields: FieldSchema[];
  policyBlocked?: boolean;
}

export interface SelectedResource {
  type: string;
  name: string;
  icon: string;
  config: Record<string, unknown>;
}

/* ── Resource Group Tags (required by policy COE-Enforce-Tag-RG) ── */

export interface ResourceGroupTags {
  "Cost Center": string;
  "Project ID": string;
  "Project Owner": string;
  "Expiry Date": string; // YYYY-MM-DD
}

/* ── Deployment Payloads (match OpenAPI spec) ── */

export interface TemplateDeploymentPayload {
  mode: "template";
  tags: ResourceGroupTags;
  template: {
    slug: string;
    formValues: Record<string, unknown>;
  };
}

export interface CustomDeploymentPayload {
  mode: "custom";
  tags: ResourceGroupTags;
  resources: SelectedResource[];
}

export type DeploymentPayload =
  | TemplateDeploymentPayload
  | CustomDeploymentPayload;

/* ── API Responses ── */

export interface SubmitResponse {
  submissionId: string;
  resourceGroup: string;
}

export type DeploymentStatus = "accepted" | "running" | "succeeded" | "failed";

export interface DeploymentStatusResponse {
  submissionId: string;
  status: DeploymentStatus;
  errorMessage: string | null;
}

export interface MyDeploymentItem {
  resourceGroup: string;
  location: string;
  tags: Record<string, string>;
  status: DeploymentStatus;
  submissionId: string | null;
  deployedAt: string | null;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
  requestId?: string;
}

/* ── Store State ── */

export interface DeploymentState {
  mode: "template" | "custom" | null;
  selectedTemplate: {
    slug: string;
    name: string;
    steps: TemplateStep[];
  } | null;
  wizardState: {
    currentStep: number;
    completedSteps: number[];
    formValues: Record<string, unknown>;
  };
  selectedResources: SelectedResource[];
  submissionId: string | null;
  deployedResourceGroup: string | null;
  deploymentSummary: string | null;
  deploymentStatus: DeploymentStatus | null;
  deploymentError: string | null;

  // Actions
  setMode: (mode: "template" | "custom") => void;
  selectTemplate: (template: Template) => void;
  updateWizardStep: (step: number) => void;
  completeStep: (step: number) => void;
  setFormValues: (values: Record<string, unknown>) => void;
  addResource: (resource: SelectedResource) => boolean;
  removeResource: (type: string) => void;
  setSubmissionResult: (id: string, summary: string, resourceGroup: string) => void;
  setDeploymentStatus: (status: DeploymentStatus, error?: string | null) => void;
  reset: () => void;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd web && npx tsc --noEmit
```

Expected: Errors on `setSubmissionResult` callers (store + review page + store test) — that's expected; we fix them in upcoming tasks.

- [ ] **Step 3: Commit**

```bash
git add web/types/index.ts
git commit -m "feat: add resourceGroup to SubmitResponse and MyDeploymentItem type; update store types"
```

---

## Task 5: Update Zustand store

**Files:**
- Modify: `web/store/deploymentStore.ts`

- [ ] **Step 1: Update the store**

Replace the entire contents of `web/store/deploymentStore.ts` with:

```ts
import { create } from "zustand";
import type { DeploymentState, DeploymentStatus, Template, SelectedResource } from "@/types";

const initialWizardState = {
  currentStep: 0,
  completedSteps: [] as number[],
  formValues: {} as Record<string, unknown>,
};

export const useDeploymentStore = create<DeploymentState>((set, get) => ({
  mode: null,
  selectedTemplate: null,
  wizardState: initialWizardState,
  selectedResources: [],
  submissionId: null,
  deployedResourceGroup: null,
  deploymentSummary: null,
  deploymentStatus: null,
  deploymentError: null,

  setMode: (mode) => set({ mode }),

  selectTemplate: (template: Template) =>
    set({
      mode: "template",
      selectedTemplate: {
        slug: template.slug,
        name: template.name,
        steps: template.steps,
      },
      wizardState: { ...initialWizardState },
    }),

  updateWizardStep: (step) =>
    set((state) => ({
      wizardState: { ...state.wizardState, currentStep: step },
    })),

  completeStep: (step) => {
    if (get().wizardState.completedSteps.includes(step)) return;
    set((state) => ({
      wizardState: {
        ...state.wizardState,
        completedSteps: [...state.wizardState.completedSteps, step],
      },
    }));
  },

  setFormValues: (values) =>
    set((state) => ({
      wizardState: {
        ...state.wizardState,
        formValues: { ...state.wizardState.formValues, ...values },
      },
    })),

  addResource: (resource: SelectedResource) => {
    const isDuplicate = get().selectedResources.some(
      (r) => r.type === resource.type,
    );
    if (isDuplicate) return false;
    set((state) => ({ selectedResources: [...state.selectedResources, resource] }));
    return true;
  },

  removeResource: (type: string) =>
    set((state) => ({
      selectedResources: state.selectedResources.filter((r) => r.type !== type),
    })),

  setSubmissionResult: (id: string, summary: string, resourceGroup: string) =>
    set({ submissionId: id, deploymentSummary: summary, deployedResourceGroup: resourceGroup }),

  setDeploymentStatus: (status: DeploymentStatus, error?: string | null) =>
    set({ deploymentStatus: status, deploymentError: error ?? null }),

  reset: () =>
    set({
      mode: null,
      selectedTemplate: null,
      wizardState: { ...initialWizardState },
      selectedResources: [],
      submissionId: null,
      deployedResourceGroup: null,
      deploymentSummary: null,
      deploymentStatus: null,
      deploymentError: null,
    }),
}));
```

- [ ] **Step 2: Update store test**

Replace the entire contents of `web/__tests__/store/deploymentStore.test.ts` with:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { useDeploymentStore } from "@/store/deploymentStore";
import type { Template, SelectedResource } from "@/types";

const mockTemplate: Template = {
  slug: "web-application",
  name: "Web Application",
  description: "Test",
  category: "compute",
  icon: "Globe",
  resourceCount: 1,
  estimatedTime: "~5 min",
  steps: [
    {
      title: "Step 1",
      description: "First step",
      fields: [
        { name: "appName", label: "App name", type: "text", required: true },
      ],
    },
  ],
};

const mockResource: SelectedResource = {
  type: "Microsoft.Web/sites",
  name: "Web Application",
  icon: "Globe",
  config: { appName: "test-app" },
};

describe("deploymentStore", () => {
  beforeEach(() => {
    useDeploymentStore.getState().reset();
  });

  it("starts with null mode", () => {
    expect(useDeploymentStore.getState().mode).toBeNull();
  });

  it("sets mode", () => {
    useDeploymentStore.getState().setMode("template");
    expect(useDeploymentStore.getState().mode).toBe("template");
  });

  it("selectTemplate sets template and resets wizard state", () => {
    useDeploymentStore.getState().setFormValues({ appName: "old-value" });
    useDeploymentStore.getState().completeStep(0);
    useDeploymentStore.getState().selectTemplate(mockTemplate);

    const state = useDeploymentStore.getState();
    expect(state.selectedTemplate?.slug).toBe("web-application");
    expect(state.mode).toBe("template");
    expect(state.wizardState.currentStep).toBe(0);
    expect(state.wizardState.completedSteps).toHaveLength(0);
    expect(state.wizardState.formValues).toEqual({});
  });

  it("prevents duplicate resource types", () => {
    const added1 = useDeploymentStore.getState().addResource(mockResource);
    expect(added1).toBe(true);
    expect(useDeploymentStore.getState().selectedResources).toHaveLength(1);

    const added2 = useDeploymentStore
      .getState()
      .addResource({ ...mockResource, config: { appName: "other" } });
    expect(added2).toBe(false);
    expect(useDeploymentStore.getState().selectedResources).toHaveLength(1);
  });

  it("removes a resource by type", () => {
    useDeploymentStore.getState().addResource(mockResource);
    useDeploymentStore.getState().removeResource(mockResource.type);
    expect(useDeploymentStore.getState().selectedResources).toHaveLength(0);
  });

  it("setSubmissionResult stores id, summary, and resourceGroup", () => {
    useDeploymentStore.getState().setSubmissionResult("sub-123", "proof text", "my-app-rg");

    const state = useDeploymentStore.getState();
    expect(state.submissionId).toBe("sub-123");
    expect(state.deploymentSummary).toBe("proof text");
    expect(state.deployedResourceGroup).toBe("my-app-rg");
  });

  it("reset clears all state including deployedResourceGroup", () => {
    useDeploymentStore.getState().setMode("custom");
    useDeploymentStore.getState().addResource(mockResource);
    useDeploymentStore.getState().setSubmissionResult("sub-123", "proof text", "my-app-rg");

    useDeploymentStore.getState().reset();

    const state = useDeploymentStore.getState();
    expect(state.mode).toBeNull();
    expect(state.selectedResources).toHaveLength(0);
    expect(state.submissionId).toBeNull();
    expect(state.deployedResourceGroup).toBeNull();
    expect(state.deploymentSummary).toBeNull();
  });

  it("completeStep adds step index to completedSteps", () => {
    useDeploymentStore.getState().completeStep(0);
    useDeploymentStore.getState().completeStep(1);
    expect(useDeploymentStore.getState().wizardState.completedSteps).toEqual([0, 1]);
  });

  it("completeStep does not duplicate completed steps", () => {
    useDeploymentStore.getState().completeStep(0);
    useDeploymentStore.getState().completeStep(0);
    expect(useDeploymentStore.getState().wizardState.completedSteps).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run store tests**

```bash
cd web && npx vitest run __tests__/store/deploymentStore.test.ts
```

Expected: PASS — 8 tests

- [ ] **Step 4: Commit**

```bash
git add web/store/deploymentStore.ts web/__tests__/store/deploymentStore.test.ts
git commit -m "feat: add deployedResourceGroup to store; update setSubmissionResult signature"
```

---

## Task 6: Update client API helpers

**Files:**
- Modify: `web/lib/api.ts`

- [ ] **Step 1: Update api.ts**

Replace the entire contents of `web/lib/api.ts` with:

```ts
import type {
  DeploymentPayload,
  DeploymentStatusResponse,
  MyDeploymentItem,
  SubmitResponse,
  ErrorResponse,
} from "@/types";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: { path: string; message: string }[],
    public requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorBody(response: Response): Promise<never> {
  let errorBody: ErrorResponse;
  try {
    errorBody = (await response.json()) as ErrorResponse;
  } catch {
    throw new ApiError("UNKNOWN_ERROR", `Request failed with status ${response.status}`);
  }
  throw new ApiError(
    errorBody.error.code,
    errorBody.error.message,
    errorBody.error.details,
    errorBody.requestId,
  );
}

export async function submitDeployment(
  payload: DeploymentPayload,
): Promise<SubmitResponse> {
  const response = await fetch("/api/deployments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.status === 201) {
    return response.json() as Promise<SubmitResponse>;
  }

  return parseErrorBody(response);
}

export async function getDeployment(
  submissionId: string,
  resourceGroup: string,
): Promise<DeploymentStatusResponse> {
  const response = await fetch(
    `/api/deployments/${submissionId}?rg=${encodeURIComponent(resourceGroup)}`,
  );

  if (response.status === 200) {
    return response.json() as Promise<DeploymentStatusResponse>;
  }

  return parseErrorBody(response);
}

export async function listMyDeployments(): Promise<MyDeploymentItem[]> {
  const response = await fetch("/api/my-deployments");

  if (response.status === 200) {
    return response.json() as Promise<MyDeploymentItem[]>;
  }

  return parseErrorBody(response);
}
```

- [ ] **Step 2: Compile check**

```bash
cd web && npx tsc --noEmit
```

Expected: Errors only on `review/page.tsx` (wrong `getDeployment` call and `setSubmissionResult` call) — will fix in Task 8.

- [ ] **Step 3: Commit**

```bash
git add web/lib/api.ts
git commit -m "feat: update getDeployment to accept resourceGroup; add listMyDeployments"
```

---

## Task 7: Update POST /api/deployments — remove DB, return resourceGroup

**Files:**
- Modify: `web/app/api/deployments/route.ts`

- [ ] **Step 1: Rewrite the route**

Replace the entire contents of `web/app/api/deployments/route.ts` with:

```ts
import { NextResponse } from "next/server";
import { QueueServiceClient } from "@azure/storage-queue";
import { serverEnv } from "@/lib/server-env";
import { AppError, toErrorResponse } from "@/lib/errors";
import { deploymentPayloadSchema } from "@/lib/deployments/schema";
import { deriveResourceGroupName, deriveLocation } from "@/lib/deployments/rg-name";
import type { DeploymentPayload } from "@/lib/deployments/schema";

interface DeploymentJobMessage {
  submissionId: string;
  resourceGroupName: string;
  location: string;
  payload: DeploymentPayload;
  tags: Record<string, string>;
}

const queueClient = QueueServiceClient.fromConnectionString(
  serverEnv.AZURE_STORAGE_CONNECTION_STRING
).getQueueClient("deployment-jobs");

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const err = AppError.validation("Request body must be valid JSON");
      return NextResponse.json(toErrorResponse(err, requestId), { status: 400 });
    }

    const parseResult = deploymentPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      const err = AppError.validation(
        "Request validation failed",
        parseResult.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }))
      );
      return NextResponse.json(toErrorResponse(err, requestId), { status: 400 });
    }

    const payload = parseResult.data;
    const submissionId = crypto.randomUUID();
    const resourceGroupName = deriveResourceGroupName(payload);
    const location = deriveLocation(payload);

    const message: DeploymentJobMessage = {
      submissionId,
      resourceGroupName,
      location,
      payload,
      tags: payload.tags,
    };

    await queueClient.sendMessage(
      Buffer.from(JSON.stringify(message)).toString("base64")
    );

    return NextResponse.json({ submissionId, resourceGroup: resourceGroupName }, { status: 201 });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(toErrorResponse(err, requestId), { status: err.statusCode });
    }
    console.error(err);
    const internal = AppError.internal();
    return NextResponse.json(toErrorResponse(internal, requestId), { status: 500 });
  }
}
```

- [ ] **Step 2: Compile check**

```bash
cd web && npx tsc --noEmit
```

Expected: Fewer errors now. Still errors on routes that import `@/lib/db` (the [submissionId] route) — will be fixed next.

- [ ] **Step 3: Commit**

```bash
git add web/app/api/deployments/route.ts
git commit -m "feat: POST /api/deployments — remove DB, generate submissionId, return resourceGroup"
```

---

## Task 8: Update GET /api/deployments/[submissionId] — ARM-based status

**Files:**
- Modify: `web/app/api/deployments/[submissionId]/route.ts`

- [ ] **Step 1: Rewrite the route**

Replace the entire contents of `web/app/api/deployments/[submissionId]/route.ts` with:

```ts
import { NextResponse } from "next/server";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getArmClient } from "@/lib/arm";
import { mapArmProvisioningState } from "@/lib/deployments/arm-status";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const requestId = crypto.randomUUID();
  const { submissionId } = await params;
  const { searchParams } = new URL(request.url);
  const rg = searchParams.get("rg");

  if (!rg) {
    const err = AppError.validation("rg query parameter is required");
    return NextResponse.json(toErrorResponse(err, requestId), { status: 400 });
  }

  try {
    const client = getArmClient();
    let status: ReturnType<typeof mapArmProvisioningState>;
    let errorMessage: string | null = null;

    try {
      const dep = await client.deployments.get(rg, submissionId);
      status = mapArmProvisioningState(dep.properties?.provisioningState);
      if (status === "failed") {
        const armErr = dep.properties?.error as
          | { code?: string; message?: string }
          | undefined;
        errorMessage = armErr
          ? `[${armErr.code ?? "Error"}] ${armErr.message ?? ""}`
          : "Deployment failed";
      }
    } catch (armErr: unknown) {
      if (
        typeof armErr === "object" &&
        armErr !== null &&
        "statusCode" in armErr &&
        (armErr as { statusCode: number }).statusCode === 404
      ) {
        status = "accepted";
      } else {
        throw armErr;
      }
    }

    return NextResponse.json({ submissionId, status, errorMessage });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(toErrorResponse(err, requestId), { status: err.statusCode });
    }
    console.error(err);
    const internal = AppError.internal();
    return NextResponse.json(toErrorResponse(internal, requestId), { status: 500 });
  }
}
```

- [ ] **Step 2: Compile check**

```bash
cd web && npx tsc --noEmit
```

Expected: Only errors remaining are on `review/page.tsx` (wrong `setSubmissionResult` args).

- [ ] **Step 3: Commit**

```bash
git add "web/app/api/deployments/[submissionId]/route.ts"
git commit -m "feat: GET /api/deployments/[id] — ARM status lookup via ?rg= query param"
```

---

## Task 9: Create GET /api/my-deployments route

**Files:**
- Create: `web/app/api/my-deployments/route.ts`

- [ ] **Step 1: Create the route**

Create `web/app/api/my-deployments/route.ts`:

```ts
import { NextResponse } from "next/server";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getArmClient } from "@/lib/arm";
import { mapArmProvisioningState } from "@/lib/deployments/arm-status";
import type { MyDeploymentItem, DeploymentStatus } from "@/types";

const DEPLOYED_BY = "demo@sandbox.local"; // replace with real UPN when MSAL auth lands

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const client = getArmClient();
    const items: MyDeploymentItem[] = [];

    const rgIterator = client.resourceGroups.list({
      filter: `tagName eq 'deployedBy' and tagValue eq '${DEPLOYED_BY}'`,
    });

    for await (const rg of rgIterator) {
      const rgName = rg.name!;
      let status: DeploymentStatus = "accepted";
      let submissionId: string | null = null;
      let deployedAt: string | null = null;

      const taggedId = rg.tags?.["iac-submissionId"] ?? null;
      if (taggedId) {
        try {
          const dep = await client.deployments.get(rgName, taggedId);
          status = mapArmProvisioningState(dep.properties?.provisioningState);
          submissionId = taggedId;
          deployedAt = dep.properties?.timestamp?.toISOString() ?? null;
        } catch {
          // Deployment record gone or not yet written — leave status as accepted
        }
      }

      items.push({
        resourceGroup: rgName,
        location: rg.location ?? "",
        tags: (rg.tags ?? {}) as Record<string, string>,
        status,
        submissionId,
        deployedAt,
      });
    }

    items.sort((a, b) => {
      if (!a.deployedAt) return 1;
      if (!b.deployedAt) return -1;
      return new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime();
    });

    return NextResponse.json(items);
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(toErrorResponse(err, requestId), { status: err.statusCode });
    }
    console.error(err);
    const internal = AppError.internal();
    return NextResponse.json(toErrorResponse(internal, requestId), { status: 500 });
  }
}
```

- [ ] **Step 2: Compile check**

```bash
cd web && npx tsc --noEmit
```

Expected: Still only `review/page.tsx` errors remaining.

- [ ] **Step 3: Commit**

```bash
git add web/app/api/my-deployments/route.ts
git commit -m "feat: GET /api/my-deployments — list ARM resource groups by deployedBy tag"
```

---

## Task 10: Update review page

**Files:**
- Modify: `web/app/review/page.tsx`

- [ ] **Step 1: Update review page**

In `web/app/review/page.tsx`, make two targeted changes:

**Change 1** — destructure `deployedResourceGroup` from store (line 19):

```ts
// Old:
const { mode, selectedTemplate, wizardState, selectedResources, submissionId, deploymentStatus, deploymentError, setSubmissionResult, setDeploymentStatus, reset } = useDeploymentStore();

// New:
const { mode, selectedTemplate, wizardState, selectedResources, submissionId, deployedResourceGroup, deploymentStatus, deploymentError, setSubmissionResult, setDeploymentStatus, reset } = useDeploymentStore();
```

**Change 2** — update the polling `getDeployment` call (the line inside the `setInterval` callback):

```ts
// Old:
const result = await getDeployment(submissionId);

// New:
const result = await getDeployment(submissionId, deployedResourceGroup!);
```

**Change 3** — update `setSubmissionResult` call in `handleSubmit` (after `const report = generateReport(...)`):

```ts
// Old:
setSubmissionResult(result.submissionId, report);

// New:
setSubmissionResult(result.submissionId, report, result.resourceGroup);
```

- [ ] **Step 2: Compile check**

```bash
cd web && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: The existing `review/page.test.tsx` will have failing tests because the mock `submitDeployment` returns `{ submissionId: "SUB-TEST-123" }` but now expects `resourceGroup` too. Fix the mock in the next step.

- [ ] **Step 4: Update review page test**

In `web/__tests__/app/review/page.test.tsx`, update the mock submit response (inside `beforeEach`):

```ts
// Old:
mockSubmit.mockResolvedValue({ submissionId: "SUB-TEST-123" });

// New:
mockSubmit.mockResolvedValue({ submissionId: "SUB-TEST-123", resourceGroup: "sandbox-rg" });
```

- [ ] **Step 5: Run all tests again**

```bash
npx vitest run
```

Expected: PASS — all tests including the 5 review page tests

- [ ] **Step 6: Commit**

```bash
git add web/app/review/page.tsx web/__tests__/app/review/page.test.tsx
git commit -m "feat: review page passes deployedResourceGroup to getDeployment poll"
```

---

## Task 11: Create My Stuff page

**Files:**
- Create: `web/app/my-stuff/page.tsx`
- Create: `web/__tests__/app/my-stuff/page.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `web/__tests__/app/my-stuff/page.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import MyStuffPage from "@/app/my-stuff/page";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  listMyDeployments: vi.fn(),
  ApiError: class ApiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

const mockList = api.listMyDeployments as ReturnType<typeof vi.fn>;

describe("MyStuffPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockList.mockReturnValue(new Promise(() => {}));
    render(<MyStuffPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders a list of resource groups", async () => {
    mockList.mockResolvedValue([
      {
        resourceGroup: "my-app-rg",
        location: "southeastasia",
        tags: { "Cost Center": "CC-001", "Project ID": "PROJ-001", "Project Owner": "Alice", "Expiry Date": "2027-01-01" },
        status: "succeeded",
        submissionId: "sub-abc",
        deployedAt: "2026-04-20T10:00:00.000Z",
      },
    ]);

    render(<MyStuffPage />);

    await waitFor(() =>
      expect(screen.getByText("my-app-rg")).toBeInTheDocument()
    );
    expect(screen.getByText(/succeeded/i)).toBeInTheDocument();
  });

  it("shows empty state when no deployments found", async () => {
    mockList.mockResolvedValue([]);

    render(<MyStuffPage />);

    await waitFor(() =>
      expect(screen.getByText(/no deployments/i)).toBeInTheDocument()
    );
  });

  it("shows error message when API call fails", async () => {
    mockList.mockRejectedValue(new Error("Network error"));

    render(<MyStuffPage />);

    await waitFor(() =>
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
    );
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd web && npx vitest run __tests__/app/my-stuff/page.test.tsx
```

Expected: FAIL — `Cannot find module '@/app/my-stuff/page'`

- [ ] **Step 3: Create the My Stuff page**

Create `web/app/my-stuff/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { listMyDeployments, ApiError } from "@/lib/api";
import type { MyDeploymentItem } from "@/types";
import { Loader2, Package } from "lucide-react";

function statusLabel(status: MyDeploymentItem["status"]): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function statusColor(status: MyDeploymentItem["status"]): string {
  switch (status) {
    case "succeeded": return "text-green-400";
    case "failed": return "text-red-400";
    case "running": return "text-yellow-400";
    default: return "text-text-muted";
  }
}

export default function MyStuffPage() {
  const [items, setItems] = useState<MyDeploymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyDeployments()
      .then(setItems)
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Failed to load deployments");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text">My Stuff</h1>
        <p className="mt-1 text-text-muted">
          Resource groups you have deployed through this portal.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading deployments...</span>
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          Failed to load: {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-text-muted">
          <Package className="h-10 w-10 opacity-40" />
          <p className="text-sm">No deployments found.</p>
          <p className="text-xs opacity-70">
            Deployments you submit will appear here.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.resourceGroup}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-semibold text-text">
                    {item.resourceGroup}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {item.location}
                    {item.deployedAt && (
                      <>
                        {" · "}
                        {new Date(item.deployedAt).toLocaleDateString("en-MY", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </>
                    )}
                  </p>
                </div>
                <span className={`shrink-0 text-sm font-medium ${statusColor(item.status)}`}>
                  {statusLabel(item.status)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {(["Cost Center", "Project ID", "Project Owner", "Expiry Date"] as const).map(
                  (tag) =>
                    item.tags[tag] ? (
                      <span key={tag} className="text-xs text-text-muted">
                        <span className="font-medium text-text">{tag}:</span>{" "}
                        {item.tags[tag]}
                      </span>
                    ) : null
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run the My Stuff tests**

```bash
cd web && npx vitest run __tests__/app/my-stuff/page.test.tsx
```

Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add web/app/my-stuff/page.tsx web/__tests__/app/my-stuff/page.test.tsx
git commit -m "feat: add My Stuff page listing ARM-tracked deployments"
```

---

## Task 12: Update Sidebar link

**Files:**
- Modify: `web/components/layout/Sidebar.tsx`

- [ ] **Step 1: Update the My stuff href**

In `web/components/layout/Sidebar.tsx`, change the `MAIN_LINKS` array:

```ts
// Old:
{ href: "/templates", label: "My stuff", icon: List },

// New:
{ href: "/my-stuff", label: "My stuff", icon: List },
```

- [ ] **Step 2: Run all tests**

```bash
cd web && npx vitest run
```

Expected: PASS — all tests

- [ ] **Step 3: Commit**

```bash
git add web/components/layout/Sidebar.tsx
git commit -m "feat: update My stuff sidebar link to /my-stuff"
```

---

## Task 13: Remove Prisma from web server-env and delete web DB files

**Files:**
- Modify: `web/lib/server-env.ts`
- Delete: `web/lib/db.ts`
- Delete: `web/prisma/schema.prisma`

- [ ] **Step 1: Remove DATABASE_URL from server-env**

Replace the entire contents of `web/lib/server-env.ts` with:

```ts
import { z } from "zod";

const envSchema = z.object({
  AZURE_SUBSCRIPTION_ID: z.string().min(1, "AZURE_SUBSCRIPTION_ID is required"),
  AZURE_TENANT_ID: z.string().min(1, "AZURE_TENANT_ID is required"),
  AZURE_STORAGE_CONNECTION_STRING: z.string().min(1, "AZURE_STORAGE_CONNECTION_STRING is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${formatted}`);
}

export const serverEnv = parsed.data;
```

- [ ] **Step 2: Delete web DB files**

```bash
cd web && rm lib/db.ts prisma/schema.prisma
```

- [ ] **Step 3: Full type check and test run**

```bash
npx tsc --noEmit && npx vitest run
```

Expected: 0 TypeScript errors, all tests pass.

- [ ] **Step 4: Commit**

```bash
cd .. && git add web/lib/server-env.ts
git rm web/lib/db.ts web/prisma/schema.prisma
git commit -m "chore: remove DATABASE_URL from server-env; delete web Prisma files"
```

---

## Task 14: Update Function App — remove DB, add tags to RG

**Files:**
- Modify: `functions/src/lib/env.ts`
- Modify: `functions/src/modules/deployments/bicep-executor.ts`
- Modify: `functions/src/functions/processDeployment.ts`
- Delete: `functions/src/lib/db.ts`
- Delete: `functions/src/modules/deployments/deployment.repo.ts`

- [ ] **Step 1: Remove DATABASE_URL from functions env**

Replace the entire contents of `functions/src/lib/env.ts` with:

```ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  AZURE_SUBSCRIPTION_ID: z.string().min(1, "AZURE_SUBSCRIPTION_ID is required"),
  AZURE_TENANT_ID: z.string().min(1, "AZURE_TENANT_ID is required"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${formatted}`);
}

export default parsed.data;
```

- [ ] **Step 2: Add deployedBy and iac-submissionId tags to RG creation**

In `functions/src/modules/deployments/bicep-executor.ts`, update the `resourceGroups.createOrUpdate` call (Step 2 in the existing comment block):

```ts
// Old:
await client.resourceGroups.createOrUpdate(opts.resourceGroupName, {
  location: opts.location,
  tags: opts.tags,
});

// New:
await client.resourceGroups.createOrUpdate(opts.resourceGroupName, {
  location: opts.location,
  tags: {
    ...opts.tags,
    deployedBy: "demo@sandbox.local", // replace with real UPN when MSAL auth lands
    "iac-submissionId": opts.deploymentName,
  },
});
```

- [ ] **Step 3: Remove DB calls from processDeployment**

Replace the entire contents of `functions/src/functions/processDeployment.ts` with:

```ts
import { app, InvocationContext } from "@azure/functions";
import { executeBicepDeployment } from "../modules/deployments/bicep-executor.js";
import type { DeploymentPayload } from "../modules/deployments/deployment.schema.js";

export interface DeploymentJobMessage {
  submissionId: string;
  resourceGroupName: string;
  location: string;
  payload: DeploymentPayload;
  tags: Record<string, string>;
}

async function processDeployment(
  queueItem: unknown,
  context: InvocationContext
): Promise<void> {
  const message: DeploymentJobMessage =
    typeof queueItem === "string"
      ? (JSON.parse(queueItem) as DeploymentJobMessage)
      : (queueItem as DeploymentJobMessage);

  const { submissionId, resourceGroupName, location, payload, tags } = message;

  context.log(`Processing deployment ${submissionId} for RG ${resourceGroupName}`);

  try {
    await executeBicepDeployment({
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID!,
      resourceGroupName,
      deploymentName: submissionId,
      payload,
      location,
      tags,
    });

    context.log(`Deployment ${submissionId} succeeded`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    context.error(`Deployment ${submissionId} failed: ${errorMessage}`);
  }
}

app.storageQueue("processDeployment", {
  queueName: "deployment-jobs",
  connection: "DEPLOYMENT_QUEUE",
  handler: processDeployment,
});
```

Note: `AZURE_SUBSCRIPTION_ID` is read directly from `process.env` here because we removed the env validation module's DATABASE_URL requirement. If you prefer to keep using the env module, it now exports without DATABASE_URL.

Actually — update to use the env module for consistency:

```ts
import env from "../lib/env.js";
// ...
await executeBicepDeployment({
  subscriptionId: env.AZURE_SUBSCRIPTION_ID,
  // ...
```

Use this version instead (imports `env` from `../lib/env.js` and uses `env.AZURE_SUBSCRIPTION_ID`).

- [ ] **Step 4: Delete DB files**

```bash
cd functions && rm src/lib/db.ts src/modules/deployments/deployment.repo.ts
```

- [ ] **Step 5: Type check functions**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
cd .. && git add functions/src/lib/env.ts functions/src/modules/deployments/bicep-executor.ts functions/src/functions/processDeployment.ts
git rm functions/src/lib/db.ts functions/src/modules/deployments/deployment.repo.ts
git commit -m "feat: Function App removes DB; tags RG with deployedBy + iac-submissionId"
```

---

## Task 15: Update CI and remove docker-compose

**Files:**
- Modify: `.github/workflows/ci.yml`
- Delete: `docker-compose.yml`

- [ ] **Step 1: Update CI**

Replace the entire contents of `.github/workflows/ci.yml` with:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true

jobs:
  web:
    name: Frontend
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: web/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
        env:
          AZURE_SUBSCRIPTION_ID: 00000000-0000-0000-0000-000000000000
          AZURE_TENANT_ID: 00000000-0000-0000-0000-000000000000
          AZURE_STORAGE_CONNECTION_STRING: DefaultEndpointsProtocol=https;AccountName=build;AccountKey=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==;EndpointSuffix=core.windows.net

      - name: Prune dev dependencies
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: npm prune --omit=dev

      - name: Deploy to Azure App Service
        uses: azure/webapps-deploy@v3
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        with:
          app-name: epf-experimental-sandbox-playground
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: web/

  functions:
    name: Functions
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: functions

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
          cache-dependency-path: functions/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Build
        run: npm run build

      - name: Prune dev dependencies
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        run: npm prune --omit=dev

      - name: Deploy to Azure Functions
        uses: azure/webapps-deploy@v3
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        with:
          app-name: epf-sandbox-functions
          publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
          package: ./functions
```

- [ ] **Step 2: Delete docker-compose.yml**

```bash
cd /c/Users/AB3968/Git/IAC-Sandbox && rm docker-compose.yml
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git rm docker-compose.yml
git commit -m "chore: remove prisma generate and DATABASE_URL from CI; remove docker-compose"
```

---

## Task 16: Final verification

- [ ] **Step 1: Full web type check**

```bash
cd web && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 2: Full web test run**

```bash
npx vitest run
```

Expected: All tests pass (should be ≥ 103 — previous 99 + 8 arm-status + 4 my-stuff + 1 updated store test)

- [ ] **Step 3: Web lint**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings

- [ ] **Step 4: Functions type check**

```bash
cd ../functions && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 5: Remove DATABASE_URL from App Service env (Azure Portal)**

In Azure Portal → App Service `epf-experimental-sandbox-playground` → Configuration → Application settings:
- Delete `DATABASE_URL` setting
- Save

Also remove from Function App `epf-sandbox-functions` if it was set there.

- [ ] **Step 6: Confirm deployment on main**

Push to `main` and confirm both CI jobs pass (no `prisma generate` step, no `DATABASE_URL` dummy).

- [ ] **Step 7: Smoke test**

Visit the live URL. Submit a deployment. Verify:
1. Submission returns immediately with `{ submissionId, resourceGroup }`
2. Review modal opens and polls for status
3. Navigate to `/my-stuff` — page loads and shows "No deployments found" (or your RG if the deployment completed)
