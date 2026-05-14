"use client";

import { useEffect, useState } from "react";
import { ResourceCatalog } from "@/components/builder/ResourceCatalog";
import { ResourceDrawer } from "@/components/builder/ResourceDrawer";
import { SelectedPanel } from "@/components/builder/SelectedPanel";
import { PageEyebrow } from "@/components/layout/PageEyebrow";
import { MonoSectionHeader } from "@/components/ui/MonoSectionHeader";
import { useDeploymentStore } from "@/store/deploymentStore";
import resources from "@/data/resources.json";
import type { AzureResource } from "@/types";

export default function BuilderPage() {
  const { selectedResources, addResource, removeResource, setMode } =
    useDeploymentStore();

  useEffect(() => {
    setMode("custom");
  }, [setMode]);

  const [activeResource, setActiveResource] = useState<AzureResource | null>(
    null,
  );

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
    <div className="mx-auto max-w-7xl px-6 py-8 md:px-8 md:py-12">
      <PageEyebrow path="builder" />

      <h1 className="font-mono text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium text-text mb-2">
        <span className="text-text-faint"># </span>builder
      </h1>
      <p className="mt-2 mb-8 text-sm text-text-muted md:text-base">
        Choose Azure resources one at a time and configure each one. Review
        your complete setup before submitting.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <MonoSectionHeader title="available-resources" />
          <ResourceCatalog
            resources={resources as AzureResource[]}
            selectedTypes={selectedTypes}
            onSelect={handleSelect}
          />
        </div>

        <div className="lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100vh-7rem)] lg:flex-col">
          <MonoSectionHeader title="selected" />
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
