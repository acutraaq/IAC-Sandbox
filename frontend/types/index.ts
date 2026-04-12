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
}

/* ── Resources (custom builder) ── */

export interface AzureResource {
  type: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  fields: FieldSchema[];
}

export interface SelectedResource {
  type: string;
  name: string;
  icon: string;
  config: Record<string, unknown>;
}

/* ── Deployment Payloads (match OpenAPI spec) ── */

export interface TemplateDeploymentPayload {
  mode: "template";
  template: {
    slug: string;
    formValues: Record<string, unknown>;
  };
}

export interface CustomDeploymentPayload {
  mode: "custom";
  resources: SelectedResource[];
}

export type DeploymentPayload =
  | TemplateDeploymentPayload
  | CustomDeploymentPayload;

/* ── API Responses ── */

export interface SubmitResponse {
  submissionId: string;
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

  // Actions
  setMode: (mode: "template" | "custom") => void;
  selectTemplate: (template: Template) => void;
  updateWizardStep: (step: number) => void;
  completeStep: (step: number) => void;
  setFormValues: (values: Record<string, unknown>) => void;
  addResource: (resource: SelectedResource) => boolean;
  removeResource: (type: string) => void;
  setSubmissionResult: (id: string, summary: string) => void;
  reset: () => void;
}
