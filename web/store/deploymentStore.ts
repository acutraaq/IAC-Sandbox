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

  setSubmissionResult: (id: string, summary: string) =>
    set({ submissionId: id, deploymentSummary: summary }),

  setDeploymentStatus: (status: DeploymentStatus, error?: string | null) =>
    set({ deploymentStatus: status, deploymentError: error ?? null }),

  reset: () =>
    set({
      mode: null,
      selectedTemplate: null,
      wizardState: { ...initialWizardState },
      selectedResources: [],
      submissionId: null,
      deploymentSummary: null,
      deploymentStatus: null,
      deploymentError: null,
    }),
}));
