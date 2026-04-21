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
}

export type DeploymentStatus = "accepted" | "running" | "succeeded" | "failed";

export interface DeploymentStatusResponse {
  submissionId: string;
  status: DeploymentStatus;
  errorMessage: string | null;
}

export interface DeploymentListItem {
  submissionId: string;
  mode: "template" | "custom";
  status: DeploymentStatus;
  resourceGroup: string;
  errorMessage: string | null;
  createdAt: string;
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
  setSubmissionResult: (id: string, summary: string) => void;
  setDeploymentStatus: (status: DeploymentStatus, error?: string | null) => void;
  reset: () => void;
}
