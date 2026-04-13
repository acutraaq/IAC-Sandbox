"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buildSchema } from "@/lib/schema";
import type { TemplateStep } from "@/types";
import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";

interface WizardStepProps {
  step: TemplateStep;
  stepIndex: number;
  totalSteps: number;
  defaultValues: Record<string, unknown>;
  onNext: (values: Record<string, unknown>) => void;
  onBack: () => void;
  onReview: (values: Record<string, unknown>) => void;
}

export function WizardStep({
  step,
  stepIndex,
  totalSteps,
  defaultValues,
  onNext,
  onBack,
  onReview,
}: WizardStepProps) {
  const schema = buildSchema(step.fields);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as Record<string, unknown>,
  });

  const isLastStep = stepIndex === totalSteps - 1;

  function onSubmit(values: Record<string, unknown>) {
    if (isLastStep) {
      onReview(values);
    } else {
      onNext(values);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-text">{step.title}</h2>
        <p className="mt-1 text-sm text-text-muted">{step.description}</p>
      </div>

      <div className="space-y-5">
        {step.fields.map((field) => (
          <div key={field.name} className="space-y-1.5">
            {field.type !== "toggle" && (
              <label
                htmlFor={field.name}
                className="block text-sm font-medium text-text"
              >
                {field.label}
                {field.required && (
                  <>
                    <span aria-hidden="true" className="ml-1 text-error">*</span>
                    <span className="sr-only"> (required)</span>
                  </>
                )}
              </label>
            )}

            {field.type === "text" && (
              <input
                id={field.name}
                type="text"
                placeholder={field.placeholder}
                aria-invalid={!!errors[field.name]}
                aria-required={field.required}
                aria-describedby={errors[field.name] ? `${field.name}-error` : field.helpText ? `${field.name}-help` : undefined}
                {...register(field.name)}
                className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors[field.name] ? "border-error" : "border-border"
                }`}
              />
            )}

            {field.type === "number" && (
              <input
                id={field.name}
                type="number"
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                aria-invalid={!!errors[field.name]}
                aria-required={field.required}
                aria-describedby={errors[field.name] ? `${field.name}-error` : field.helpText ? `${field.name}-help` : undefined}
                {...register(field.name)}
                className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors[field.name] ? "border-error" : "border-border"
                }`}
              />
            )}

            {field.type === "select" && (
              <select
                id={field.name}
                aria-invalid={!!errors[field.name]}
                aria-required={field.required}
                aria-describedby={errors[field.name] ? `${field.name}-error` : field.helpText ? `${field.name}-help` : undefined}
                {...register(field.name)}
                className={`w-full rounded-lg border bg-surface px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent ${
                  errors[field.name] ? "border-error" : "border-border"
                }`}
              >
                <option value="">Select an option...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === "toggle" && (
              <label className="flex cursor-pointer items-start gap-3">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    id={field.name}
                    type="checkbox"
                    {...register(field.name)}
                    className="peer sr-only"
                    onChange={(e) => setValue(field.name, e.target.checked)}
                    checked={watch(field.name) as boolean | undefined ?? false}
                  />
                  <div className="h-6 w-11 rounded-full border border-border bg-surface transition-colors peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-surface-elevated" />
                  <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-text-muted transition-transform peer-checked:translate-x-5 peer-checked:bg-white" />
                </div>
                <div>
                  <span className="text-sm font-medium text-text">
                    {field.label}
                  </span>
                  {field.helpText && (
                    <p id={`${field.name}-help`} className="mt-0.5 text-xs text-text-muted">
                      {field.helpText}
                    </p>
                  )}
                </div>
              </label>
            )}

            {field.type !== "toggle" && field.helpText && (
              <p id={`${field.name}-help`} className="text-xs text-text-muted">
                {field.helpText}
              </p>
            )}

            {errors[field.name] && (
              <p
                id={`${field.name}-error`}
                role="alert"
                className="text-xs text-error"
              >
                {String(errors[field.name]?.message)}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={stepIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        <Button type="submit" size="md">
          {isLastStep ? (
            <>
              <ClipboardCheck className="h-4 w-4" />
              Review Your Setup
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
