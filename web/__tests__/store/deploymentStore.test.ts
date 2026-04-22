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
    // First put some values in wizard state
    useDeploymentStore.getState().setFormValues({ appName: "old-value" });
    useDeploymentStore.getState().completeStep(0);

    // Now select template
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
    expect(useDeploymentStore.getState().wizardState.completedSteps).toEqual([
      0, 1,
    ]);
  });

  it("completeStep does not duplicate completed steps", () => {
    useDeploymentStore.getState().completeStep(0);
    useDeploymentStore.getState().completeStep(0);
    expect(useDeploymentStore.getState().wizardState.completedSteps).toHaveLength(1);
  });

  it("updateWizardStep changes currentStep", () => {
    useDeploymentStore.getState().updateWizardStep(2);
    expect(useDeploymentStore.getState().wizardState.currentStep).toBe(2);
  });

  it("setDeploymentStatus updates status and error", () => {
    useDeploymentStore.getState().setDeploymentStatus("failed", "ARM error occurred");
    const state = useDeploymentStore.getState();
    expect(state.deploymentStatus).toBe("failed");
    expect(state.deploymentError).toBe("ARM error occurred");
  });

  it("reset clears deploymentStatus and deploymentError", () => {
    useDeploymentStore.getState().setDeploymentStatus("running");
    useDeploymentStore.getState().reset();
    const state = useDeploymentStore.getState();
    expect(state.deploymentStatus).toBeNull();
    expect(state.deploymentError).toBeNull();
  });
});
