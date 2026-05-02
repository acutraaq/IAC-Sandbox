"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDeploymentStore } from "@/store/deploymentStore";
import { submitDeployment, getDeployment, ApiError } from "@/lib/api";
import { generateReport } from "@/lib/report";
import { ReviewSection } from "@/components/review/ReviewSection";
import { ConfirmModal } from "@/components/review/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Send, Loader2, ArrowLeft, Tag } from "lucide-react";
import { tagsSchema } from "@/lib/deployments/schema";
import type { ResourceGroupTags } from "@/types";
import Link from "next/link";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageTransition } from "@/components/layout/PageTransition";

export default function ReviewPage() {
  const router = useRouter();
  const { mode, selectedTemplate, wizardState, selectedResources, submissionId, deployedResourceGroup, deploymentStatus, deploymentError, setSubmissionResult, setDeploymentStatus, reset } = useDeploymentStore();

  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofText, setProofText] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tags, setTags] = useState<ResourceGroupTags>({
    "Cost Center": "",
    "Project ID": "",
    "Project Owner": "",
    "Expiry Date": "",
  });
  const [tagErrors, setTagErrors] = useState<Partial<Record<keyof ResourceGroupTags, string>>>({});

  function validateTags(): boolean {
    const result = tagsSchema.safeParse(tags);
    if (result.success) {
      setTagErrors({});
      return true;
    }
    const errors: Partial<Record<keyof ResourceGroupTags, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as keyof ResourceGroupTags;
      errors[key] = issue.message;
    }
    setTagErrors(errors);
    return false;
  }

  useEffect(() => {
    if (!mode) {
      router.replace("/");
    }
  }, [mode, router]);

  useEffect(() => {
    if (!submissionId || !modalOpen) return;

    pollRef.current = setInterval(async () => {
      try {
        const result = await getDeployment(submissionId, deployedResourceGroup!);
        const current = useDeploymentStore.getState();
        if (result.status !== current.deploymentStatus || result.errorMessage !== current.deploymentError) {
          setDeploymentStatus(result.status, result.errorMessage);
        }
        if (result.status === "succeeded" || result.status === "failed") {
          clearInterval(pollRef.current!);
          pollRef.current = null;
        }
      } catch {
        // Silently ignore transient errors — keep polling
      }
    }, 3000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [submissionId, deployedResourceGroup, modalOpen, setDeploymentStatus]);

  if (!mode) return null;

  const canSubmit =
    mode === "template"
      ? selectedTemplate !== null
      : selectedResources.length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    if (!validateTags()) return;

    setSubmitting(true);
    try {
      let payload;
      if (mode === "template" && selectedTemplate) {
        payload = {
          mode: "template" as const,
          tags,
          template: {
            slug: selectedTemplate.slug,
            formValues: wizardState.formValues,
          },
        };
      } else {
        payload = {
          mode: "custom" as const,
          tags,
          resources: selectedResources,
        };
      }

      const result = await submitDeployment(payload);
      const report = generateReport(result.submissionId, {
        mode,
        selectedTemplate,
        wizardState,
        selectedResources,
      }, tags);

      setSubmissionResult(result.submissionId, report, result.resourceGroup);
      setDeploymentStatus("accepted", null);
      setProofText(report);
      toast("success", "Deployment submitted successfully!");
      setModalOpen(true);
    } catch (error) {
      if (error instanceof ApiError) {
        toast("error", error.message);
      } else {
        toast("error", "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    reset();
    setModalOpen(false);
  }

  const backHref = mode === "template" && selectedTemplate
    ? `/templates/${selectedTemplate.slug}`
    : "/builder";

  return (
    <PageTransition>
    <div className="mx-auto max-w-[clamp(42rem,60vw,56rem)] px-6 md:px-8 py-8 md:py-12">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Review" }]} />
      <div className="mb-6">
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          {mode === "template" ? "Back to setup" : "Back to builder"}
        </Link>
        <h1 className="text-2xl font-semibold text-text">Review Your Setup</h1>
        <p className="mt-1 text-sm text-text-muted">
          Check everything looks right before submitting.
        </p>
      </div>

      <ReviewSection
        mode={mode}
        selectedTemplate={selectedTemplate}
        wizardState={wizardState}
        selectedResources={selectedResources}
      />

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center gap-2">
          <Tag className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold text-text">Resource Group Tags</p>
        </div>
        <p className="mb-4 text-xs text-text-muted">
          Required by subscription policy. All four tags must be provided.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["Cost Center", "Project ID", "Project Owner"] as const).map((field) => {
            const fieldId = `tag-${field.toLowerCase().replace(/\s+/g, "-")}`;
            const errorId = `${fieldId}-error`;
            return (
              <div key={field}>
                <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-text">
                  {field}
                  <span aria-hidden="true" className="ml-1 text-error">*</span>
                  <span className="sr-only"> (required)</span>
                </label>
                <input
                  id={fieldId}
                  type="text"
                  value={tags[field]}
                  aria-required
                  aria-invalid={!!tagErrors[field]}
                  aria-describedby={tagErrors[field] ? errorId : undefined}
                  onChange={(e) => {
                    setTags((prev) => ({ ...prev, [field]: e.target.value }));
                    if (tagErrors[field]) setTagErrors((prev) => ({ ...prev, [field]: undefined }));
                  }}
                  className={`w-full rounded-lg border bg-bg px-3 h-11 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent ${tagErrors[field] ? "border-error" : "border-border"}`}
                  placeholder={field}
                />
                {tagErrors[field] && (
                  <p id={errorId} role="alert" className="mt-1 text-xs text-error">{tagErrors[field]}</p>
                )}
              </div>
            );
          })}
          <div>
            <label htmlFor="tag-expiry-date" className="mb-1.5 block text-sm font-medium text-text">
              Expiry Date
              <span aria-hidden="true" className="ml-1 text-error">*</span>
              <span className="sr-only"> (required)</span>
            </label>
            <input
              id="tag-expiry-date"
              type="date"
              value={tags["Expiry Date"]}
              aria-required
              aria-invalid={!!tagErrors["Expiry Date"]}
              aria-describedby={tagErrors["Expiry Date"] ? "tag-expiry-date-error" : undefined}
              onChange={(e) => {
                setTags((prev) => ({ ...prev, "Expiry Date": e.target.value }));
                if (tagErrors["Expiry Date"]) setTagErrors((prev) => ({ ...prev, "Expiry Date": undefined }));
              }}
              className={`w-full rounded-lg border bg-bg px-3 h-11 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent ${tagErrors["Expiry Date"] ? "border-error" : "border-border"}`}
            />
            {tagErrors["Expiry Date"] && (
              <p id="tag-expiry-date-error" role="alert" className="mt-1 text-xs text-error">{tagErrors["Expiry Date"]}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface p-5">
        <p className="mb-4 text-sm text-text-muted">
          By submitting, you confirm this configuration is correct. A proof
          report will be generated for your approver.
        </p>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !canSubmit}
          size="lg"
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Submit for Deployment
            </>
          )}
        </Button>
      </div>

      <ConfirmModal
        open={modalOpen}
        proofText={proofText}
        deploymentStatus={deploymentStatus}
        deploymentError={deploymentError}
        resourceGroup={deployedResourceGroup ?? null}
        onClose={() => setModalOpen(false)}
        onReset={handleReset}
      />
    </div>
    </PageTransition>
  );
}
