import { create } from "zustand";
import type { DeploymentState, Template } from "@/types";

const initialWizardState = {
  currentStep: 0,
  completedSteps: [] as number[],
  formValues: {} as Record<string, unknown>,
};

export const useDeploymentStore = create<DeploymentState>((set, get) => ({
  mode: null,
  selectedTemplate: null,
  wizardState: initialWizardState,
  submissionId: null,
  deployedResourceGroup: null,
  deploymentSummary: null,

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

  setSubmissionResult: (id: string, summary: string, resourceGroup: string) =>
    set({ submissionId: id, deploymentSummary: summary, deployedResourceGroup: resourceGroup }),

  reset: () =>
    set({
      mode: null,
      selectedTemplate: null,
      wizardState: { ...initialWizardState },
      submissionId: null,
      deployedResourceGroup: null,
      deploymentSummary: null,
    }),
}));
