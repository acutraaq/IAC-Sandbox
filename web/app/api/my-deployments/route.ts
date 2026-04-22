import { NextResponse } from "next/server";
import { AppError, toErrorResponse } from "@/lib/errors";
import { getArmClient } from "@/lib/arm";
import { mapArmProvisioningState } from "@/lib/deployments/arm-status";
import type { MyDeploymentItem, DeploymentStatus } from "@/types";

const DEPLOYED_BY = "demo@sandbox.local";

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const client = getArmClient();
    const items: MyDeploymentItem[] = [];

    const rgIterator = client.resourceGroups.list({
      filter: `tagName eq 'deployedBy' and tagValue eq '${DEPLOYED_BY}'`,
    });

    for await (const rg of rgIterator) {
      const rgName = rg.name;
      if (!rgName) continue;
      let status: DeploymentStatus = "accepted";
      let submissionId: string | null = null;
      let deployedAt: string | null = null;

      const taggedId = rg.tags?.["iac-submissionId"] ?? null;
      if (taggedId) {
        try {
          const dep = await client.deployments.get(rgName, taggedId);
          status = mapArmProvisioningState(dep.properties?.provisioningState);
          submissionId = taggedId;
          deployedAt = dep.properties?.timestamp?.toISOString() ?? null;
        } catch {
          // Deployment record gone or not yet written — leave status as accepted
        }
      }

      items.push({
        resourceGroup: rgName,
        location: rg.location ?? "",
        tags: (rg.tags ?? {}) as Record<string, string>,
        status,
        submissionId,
        deployedAt,
      });
    }

    items.sort((a, b) => {
      if (!a.deployedAt) return 1;
      if (!b.deployedAt) return -1;
      return new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime();
    });

    return NextResponse.json(items);
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(toErrorResponse(err, requestId), { status: err.statusCode });
    }
    console.error("GET /api/my-deployments error:", err instanceof Error ? err.message : String(err));
    const internal = AppError.internal();
    return NextResponse.json(toErrorResponse(internal, requestId), { status: 500 });
  }
}
