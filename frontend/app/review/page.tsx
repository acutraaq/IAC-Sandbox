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
import { Send, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function ReviewPage() {
  const router = useRouter();
  const store = useDeploymentStore();
  const { mode, selectedTemplate, wizardState, selectedResources, setSubmissionResult, reset } = store;

  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofText, setProofText] = useState("");

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

    setSubmitting(true);
    try {
      let payload;
      if (mode === "template" && selectedTemplate) {
        payload = {
          mode: "template" as const,
          template: {
            slug: selectedTemplate.slug,
            formValues: wizardState.formValues,
          },
        };
      } else {
        payload = {
          mode: "custom" as const,
          resources: selectedResources,
        };
      }

      const result = await submitDeployment(payload);
      const report = generateReport(result.submissionId, {
        mode,
        selectedTemplate,
        wizardState,
        selectedResources,
      });

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

      <div className="mt-8 rounded-xl border border-border bg-surface p-5">
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
