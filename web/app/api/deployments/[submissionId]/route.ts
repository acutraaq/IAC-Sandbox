import { NextResponse } from "next/server";
import db from "@/lib/db";
import { AppError, toErrorResponse } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const requestId = crypto.randomUUID();
  const { submissionId } = await params;

  try {
    const deployment = await db.deployment.findUnique({ where: { id: submissionId } });

    if (!deployment) {
      const err = AppError.notFound(`Deployment '${submissionId}' not found`);
      return NextResponse.json(toErrorResponse(err, requestId), { status: 404 });
    }

    return NextResponse.json({
      submissionId: deployment.id,
      mode: deployment.mode,
      status: deployment.status,
      errorMessage: deployment.errorMessage ?? null,
      createdAt: deployment.createdAt,
      updatedAt: deployment.updatedAt,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(toErrorResponse(err, requestId), { status: err.statusCode });
    }
    console.error(err);
    const internal = AppError.internal();
    return NextResponse.json(toErrorResponse(internal, requestId), { status: 500 });
  }
}
