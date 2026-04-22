"use client";

import { useState, useEffect } from "react";
import { ResourceCatalog } from "@/components/builder/ResourceCatalog";
import { ResourceDrawer } from "@/components/builder/ResourceDrawer";
import { SelectedPanel } from "@/components/builder/SelectedPanel";
import { useDeploymentStore } from "@/store/deploymentStore";
import resources from "@/data/resources.json";
import type { AzureResource } from "@/types";

export default function BuilderPage() {
  const { selectedResources, setMode, addResource, removeResource } =
    useDeploymentStore();
  const [activeResource, setActiveResource] = useState<AzureResource | null>(
    null,
  );

  useEffect(() => {
    setMode("custom");
  }, [setMode]);

  const selectedTypes = selectedResources.map((r) => r.type);
  const isDuplicate = activeResource
    ? selectedTypes.includes(activeResource.type)
    : false;

  function handleSelect(resource: AzureResource) {
    setActiveResource(resource);
  }

  function handleClose() {
    setActiveResource(null);
  }

  function handleAdd(resource: { type: string; name: string; icon: string; config: Record<string, unknown> }) {
    addResource(resource);
    setActiveResource(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end">
        <div className="flex flex-col">
          <span className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Custom builder
          </span>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-text">
            Build Your Own Setup
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            Choose Azure resources one at a time and configure each one. Review
            your complete setup before submitting.
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <ResourceCatalog
          resources={resources as AzureResource[]}
          selectedTypes={selectedTypes}
          onSelect={handleSelect}
        />

        <div className="lg:sticky lg:top-24 lg:h-fit">
          <SelectedPanel resources={selectedResources} onRemove={removeResource} />
        </div>
      </div>

      <ResourceDrawer
        resource={activeResource}
        isDuplicate={isDuplicate}
        onClose={handleClose}
        onAdd={handleAdd}
      />
    </div>
  );
}
