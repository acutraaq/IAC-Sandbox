"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDeploymentStore } from "@/store/deploymentStore";
import { submitDeployment, getDeployment, getMe, ApiError } from "@/lib/api";
import { generateReport } from "@/lib/report";
import { ReviewSection } from "@/components/review/ReviewSection";
import { ConfirmModal } from "@/components/review/ConfirmModal";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import { tagsSchema } from "@/lib/deployments/schema";
import type { ResourceGroupTags, SessionUser } from "@/types";
import Link from "next/link";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { DocumentDivider } from "@/components/ui/DocumentDivider";
import { PageTransition } from "@/components/layout/PageTransition";

export default function ReviewPage() {
  const router = useRouter();
  const {
    mode,
    selectedTemplate,
    wizardState,
    setSubmissionResult,
    reset,
    submissionId,
    deployedResourceGroup,
  } = useDeploymentStore();

  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofText, setProofText] = useState("");
  const submittingRef = useRef(false);
  const [tags, setTags] = useState<ResourceGroupTags>({
    "Cost Center": "",
    "Project ID": "",
    "Project Owner": "",
    "Expiry Date": "",
  });
  const [tagErrors, setTagErrors] = useState<Partial<Record<keyof ResourceGroupTags, string>>>({});
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    getMe().then(setUser);
  }, []);

  // Silent background check: the UI intentionally shows no progress timeline
  // (submission -> HOD approval happens outside this system, and a
  // Submitted/Deploying/Complete bar was found to be misleading). But a
  // deployment can still fail after submission with nothing telling anyone —
  // so poll quietly and only speak up if it actually fails. Succeeding, or
  // still being in progress, produces no visible change at all.
  useEffect(() => {
    if (!submissionId || !deployedResourceGroup) return;

    let cancelled = false;
    let attempts = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const POLL_INTERVAL_MS = 3000;
    const MAX_POLL_ATTEMPTS = 100; // ~5 minutes, then give up quietly

    async function poll() {
      attempts += 1;
      try {
        const result = await getDeployment(submissionId!, deployedResourceGroup!);
        if (cancelled) return;
        if (result.status === "failed") {
          toast("error", result.errorMessage ?? "Deployment failed. Contact an administrator.");
          return;
        }
        if (result.status === "succeeded") {
          return;
        }
      } catch {
        // Transient network/API error — keep trying until the attempt cap
        // rather than surfacing noise for a single failed poll.
      }
      if (!cancelled && attempts < MAX_POLL_ATTEMPTS) {
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    timeoutId = setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [submissionId, deployedResourceGroup]);

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

  if (!mode) return null;

  const canSubmit = selectedTemplate !== null;

  async function handleSubmit() {
    if (!canSubmit || !selectedTemplate) return;
    if (!validateTags()) return;
    if (submittingRef.current) return;
    submittingRef.current = true;

    setSubmitting(true);
    try {
      const payload = {
        mode: "template" as const,
        tags,
        template: {
          slug: selectedTemplate.slug,
          formValues: wizardState.formValues,
        },
      };

      const result = await submitDeployment(payload);
      const reportUser = user ?? { upn: "demo@sandbox.local", displayName: "Demo User" };
      const report = generateReport(result.submissionId, {
        mode,
        selectedTemplate,
        wizardState,
      }, reportUser, tags, result.resourceGroup);

      setSubmissionResult(result.submissionId, report, result.resourceGroup);
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
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function handleReset() {
    reset();
    setModalOpen(false);
  }

  const backHref = selectedTemplate
    ? `/templates/${selectedTemplate.slug}`
    : "/";

  return (
    <PageTransition>
    <div className="mx-auto max-w-[clamp(42rem,60vw,56rem)] px-6 md:px-8 py-8 md:py-12">
      <PageEyebrow path="review" />
      <div className="mb-6">
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to setup
        </Link>
        <h1 className="font-sans text-xl md:text-2xl font-bold text-text">
          Review your setup
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Check everything looks right before submitting.
        </p>
      </div>

      <DocumentDivider label="configuration" />

      <ReviewSection
        mode={mode}
        selectedTemplate={selectedTemplate}
        wizardState={wizardState}
      />

      <DocumentDivider label="tags" />

      <div className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-text mb-4">Required tags</h2>
        <p className="text-sm text-text-muted mb-4">These labels help EPF track costs and ownership. All four are required.</p>
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
                  className={`w-full rounded-lg border bg-surface px-3 h-11 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent/40 ${tagErrors[field] ? "border-error" : "border-border"}`}
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
              className={`w-full rounded-lg border bg-surface px-3 h-11 text-sm text-text focus:outline-none focus:ring-1 focus:ring-accent/40 ${tagErrors["Expiry Date"] ? "border-error" : "border-border"}`}
            />
            {tagErrors["Expiry Date"] && (
              <p id="tag-expiry-date-error" role="alert" className="mt-1 text-xs text-error">{tagErrors["Expiry Date"]}</p>
            )}
          </div>
        </div>
      </div>

      <DocumentDivider label="submit" />

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
    </PageTransition>
  );
}
