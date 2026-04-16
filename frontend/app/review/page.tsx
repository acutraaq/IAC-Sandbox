"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDeploymentStore } from "@/store/deploymentStore";
import { submitDeployment, ApiError } from "@/lib/api";
import { generateReport } from "@/lib/report";
import { ReviewSection } from "@/components/review/ReviewSection";
import { ConfirmModal } from "@/components/review/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Send, Loader2, ArrowLeft, Tag } from "lucide-react";
import type { ResourceGroupTags } from "@/types";
import Link from "next/link";
import { useEffect } from "react";

export default function ReviewPage() {
  const router = useRouter();
  const store = useDeploymentStore();
  const { mode, selectedTemplate, wizardState, selectedResources, setSubmissionResult, reset } = store;

  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofText, setProofText] = useState("");
  const [tags, setTags] = useState<ResourceGroupTags>({
    "Cost Center": "",
    "Project ID": "",
    "Project Owner": "",
    "Expiry Date": "",
  });
  const [tagErrors, setTagErrors] = useState<Partial<Record<keyof ResourceGroupTags, string>>>({});

  function validateTags(): boolean {
    const errors: Partial<Record<keyof ResourceGroupTags, string>> = {};
    if (!tags["Cost Center"]) errors["Cost Center"] = "Required";
    if (!tags["Project ID"]) errors["Project ID"] = "Required";
    if (!tags["Project Owner"]) errors["Project Owner"] = "Required";
    if (!tags["Expiry Date"]) {
      errors["Expiry Date"] = "Required";
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(tags["Expiry Date"])) {
      errors["Expiry Date"] = "Must be YYYY-MM-DD";
    }
    setTagErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Guard: redirect if no mode selected
  useEffect(() => {
    if (!mode) {
      router.replace("/");
    }
  }, [mode, router]);

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

      setSubmissionResult(result.submissionId, report);
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
    router.push("/");
  }

  const backHref = mode === "template" && selectedTemplate
    ? `/templates/${selectedTemplate.slug}`
    : "/builder";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-text"
        >
          <ArrowLeft className="h-4 w-4" />
          {mode === "template" ? "Back to setup" : "Back to builder"}
        </Link>
        <h1 className="text-3xl font-bold text-text">Review Your Setup</h1>
        <p className="mt-1 text-text-muted">
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
          {(["Cost Center", "Project ID", "Project Owner"] as const).map((field) => (
            <div key={field}>
              <label className="mb-1 block text-xs font-medium text-text-muted">
                {field} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={tags[field]}
                onChange={(e) => {
                  setTags((prev) => ({ ...prev, [field]: e.target.value }));
                  if (tagErrors[field]) setTagErrors((prev) => ({ ...prev, [field]: undefined }));
                }}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder={field}
              />
              {tagErrors[field] && (
                <p className="mt-1 text-xs text-red-500">{tagErrors[field]}</p>
              )}
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs font-medium text-text-muted">
              Expiry Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={tags["Expiry Date"]}
              onChange={(e) => {
                setTags((prev) => ({ ...prev, "Expiry Date": e.target.value }));
                if (tagErrors["Expiry Date"]) setTagErrors((prev) => ({ ...prev, "Expiry Date": undefined }));
              }}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {tagErrors["Expiry Date"] && (
              <p className="mt-1 text-xs text-red-500">{tagErrors["Expiry Date"]}</p>
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
        onClose={() => setModalOpen(false)}
        onReset={handleReset}
      />
    </div>
  );
}
