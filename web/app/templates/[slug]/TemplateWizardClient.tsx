"use client";

import { useRouter } from "next/navigation";
import { Stepper } from "@/components/wizard/Stepper";
import { WizardStep } from "@/components/wizard/WizardStep";
import { SummaryPanel } from "@/components/wizard/SummaryPanel";
import { useDeploymentStore } from "@/store/deploymentStore";
import { useEffect } from "react";
import type { Template } from "@/types";

interface Props {
  template: Template;
}

export function TemplateWizardClient({ template }: Props) {
  const router = useRouter();
  const {
    selectedTemplate,
    wizardState,
    selectTemplate,
    updateWizardStep,
    completeStep,
    setFormValues,
  } = useDeploymentStore();

  useEffect(() => {
    if (selectedTemplate?.slug !== template.slug) {
      selectTemplate(template);
    }
  }, [template, selectedTemplate?.slug, selectTemplate]);

  const currentStep = wizardState.currentStep;
  const steps = template.steps;
  const step = steps[currentStep];

  if (!step) return null;

  function handleNext(values: Record<string, unknown>) {
    setFormValues(values);
    completeStep(currentStep);
    updateWizardStep(currentStep + 1);
  }

  function handleBack() {
    updateWizardStep(Math.max(0, currentStep - 1));
  }

  function handleReview(values: Record<string, unknown>) {
    setFormValues(values);
    completeStep(currentStep);
    router.push("/review");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-8">
        <Stepper
          steps={steps}
          currentStep={currentStep}
          completedSteps={wizardState.completedSteps}
        />

        <div className="rounded-xl border border-border bg-surface p-6">
          <WizardStep
            step={step}
            stepIndex={currentStep}
            totalSteps={steps.length}
            defaultValues={wizardState.formValues}
            onNext={handleNext}
            onBack={handleBack}
            onReview={handleReview}
          />
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:h-fit">
        <SummaryPanel
          steps={steps}
          completedSteps={wizardState.completedSteps}
          formValues={wizardState.formValues}
        />
      </div>
    </div>
  );
}
