import { NextResponse } from "next/server";
import { AppError, toErrorResponse, logError, isArmError } from "@/lib/errors";
import { getArmClient } from "@/lib/arm";
import { mapArmProvisioningState } from "@/lib/deployments/arm-status";
import { getFailureRecord } from "@/lib/deployments/failure-lookup";
import { getCurrentUser } from "@/lib/auth";

const RG_NAME_REGEX = /^[a-zA-Z0-9_.()-]+$/;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const requestId = crypto.randomUUID();
  const { submissionId } = await params;
  const { searchParams } = new URL(request.url);
  const rg = searchParams.get("rg");

  if (!rg) {
    const err = AppError.validation("rg query parameter is required");
    return NextResponse.json(toErrorResponse(err, requestId), { status: 400 });
  }

  if (!RG_NAME_REGEX.test(rg)) {
    const err = AppError.validation("rg query parameter contains invalid characters");
    return NextResponse.json(toErrorResponse(err, requestId), { status: 400 });
  }

  try {
    const client = getArmClient();
    const user = await getCurrentUser();

    // Ownership check: verify the requesting user owns this resource group
    try {
      const rgMeta = await client.resourceGroups.get(rg);
      const deployedBy = rgMeta.tags?.["deployedBy"];
      if (!deployedBy || user?.upn !== deployedBy) {
        // Return 404 to avoid enumeration
        return NextResponse.json(
          toErrorResponse(AppError.notFound("Deployment not found"), requestId),
          { status: 404 }
        );
      }
    } catch (rgErr: unknown) {
      if (isArmError(rgErr) && rgErr.statusCode === 404) {
        // RG not yet created — Function App still processing the queue message
        return NextResponse.json({ submissionId, status: "accepted", errorMessage: null });
      }
      throw rgErr;
    }

    let status: ReturnType<typeof mapArmProvisioningState>;
    let errorMessage: string | null = null;

    try {
      const dep = await client.deployments.get(rg, submissionId);
      status = mapArmProvisioningState(dep.properties?.provisioningState);
      if (status === "failed") {
        const armErr = dep.properties?.error as
          | { code?: string; message?: string }
          | undefined;
        errorMessage = armErr
          ? `[${armErr.code ?? "Error"}] ${armErr.message ?? ""}`
          : "Deployment failed";
      }
    } catch (armErr: unknown) {
      if (isArmError(armErr) && armErr.statusCode === 404) {
        const failure = await getFailureRecord(submissionId);
        if (failure) {
          status = "failed";
          errorMessage = failure.error;
        } else {
          status = "accepted";
        }
      } else {
        throw armErr;
      }
    }

    return NextResponse.json({ submissionId, status, errorMessage });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(toErrorResponse(err, requestId), { status: err.statusCode });
    }
    logError("GET /api/deployments/[submissionId]", requestId, err);
    const internal = AppError.internal();
    return NextResponse.json(toErrorResponse(internal, requestId), { status: 500 });
  }
}
