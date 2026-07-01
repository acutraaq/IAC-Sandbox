/* ── Field Schema (dynamic form fields) ── */

export interface FieldSchema {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "toggle" | "password";
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

/* ── Resources ── */

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

/* ── Auth ── */

export interface SessionUser {
  upn: string;
  displayName: string;
}

/* ── API Responses ── */

export interface SubmitResponse {
  submissionId: string;
  resourceGroup: string;
  requestId: string;
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
  errorMessage: string | null;
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

  // Actions
  setMode: (mode: "template" | "custom") => void;
  selectTemplate: (template: Template) => void;
  updateWizardStep: (step: number) => void;
  completeStep: (step: number) => void;
  setFormValues: (values: Record<string, unknown>) => void;
  addResource: (resource: SelectedResource) => boolean;
  removeResource: (type: string) => void;
  setSubmissionResult: (id: string, summary: string, resourceGroup: string) => void;
  reset: () => void;
}
