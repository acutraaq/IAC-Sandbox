import { NextResponse } from "next/server";
import { AppError, toErrorResponse, logError, isArmError } from "@/lib/errors";
import { getArmClient } from "@/lib/arm";
import { mapArmProvisioningState } from "@/lib/deployments/arm-status";

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

  try {
    const client = getArmClient();
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
        status = "accepted";
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
