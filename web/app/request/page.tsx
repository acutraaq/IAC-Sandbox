"use client";

import { useState, useEffect } from "react";
import { ResourceCatalog } from "@/components/builder/ResourceCatalog";
import { ResourceDrawer } from "@/components/builder/ResourceDrawer";
import { RequestDocument } from "@/components/request/RequestDocument";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { PageTransition } from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/Button";
import { useDeploymentStore } from "@/store/deploymentStore";
import resources from "@/data/resources.json";
import type { AzureResource } from "@/types";

export default function RequestPage() {
  const { selectedResources, setMode, addResource, removeResource, resetCustomRequest } =
    useDeploymentStore();
  const [activeResource, setActiveResource] = useState<AzureResource | null>(null);
  const [showDocument, setShowDocument] = useState(false);

  useEffect(() => {
    setMode("custom-request");
  }, [setMode]);

  const selectedTypes = selectedResources.map((r) => r.type);
  const isDuplicate = activeResource ? selectedTypes.includes(activeResource.type) : false;

  function handleSelect(resource: AzureResource) {
    setActiveResource(resource);
  }

  function handleAdd(resource: { type: string; name: string; icon: string; config: Record<string, unknown> }) {
    addResource(resource);
    setActiveResource(null);
  }

  function handleReset() {
    resetCustomRequest();
    setShowDocument(false);
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
          <div className="flex flex-col">
            <span className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
              Custom Setup Request
            </span>
            <h1 className="font-sans text-3xl font-extrabold tracking-tight text-text">
              Request a Custom Setup
            </h1>
            <p className="mt-2 text-sm text-text-muted">
              Select the resources you need. We will review your request and
              provision them after HOD approval.
            </p>
          </div>
        </div>

        {showDocument && selectedResources.length > 0 ? (
          <div className="mx-auto max-w-2xl">
            <RequestDocument resources={selectedResources} onReset={handleReset} />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            <div>
              <Breadcrumb
                items={[{ label: "Home", href: "/" }, { label: "Request Custom Setup" }]}
              />
              <ResourceCatalog
                resources={resources as AzureResource[]}
                selectedTypes={selectedTypes}
                onSelect={handleSelect}
              />
            </div>

            <div className="lg:sticky lg:top-24 lg:h-fit space-y-4">
              <div className="rounded-xl border border-border bg-surface p-4">
                <h2 className="text-sm font-semibold text-text mb-3">
                  Selected Resources
                </h2>
                {selectedResources.length === 0 ? (
                  <p className="text-xs text-text-muted">
                    No resources selected yet. Choose from the catalog on the left.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {selectedResources.map((r) => (
                      <li
                        key={r.type}
                        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg px-3 py-2"
                      >
                        <span className="text-xs font-medium text-text truncate">
                          {r.name}
                        </span>
                        <button
                          onClick={() => removeResource(r.type)}
                          className="shrink-0 text-xs text-text-muted hover:text-error transition-colors"
                          aria-label={`Remove ${r.name}`}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                className="w-full"
                disabled={selectedResources.length === 0}
                onClick={() => setShowDocument(true)}
              >
                Generate Request
              </Button>
            </div>
          </div>
        )}

        <ResourceDrawer
          resource={activeResource}
          isDuplicate={isDuplicate}
          onClose={() => setActiveResource(null)}
          onAdd={handleAdd}
        />
      </div>
    </PageTransition>
  );
}
