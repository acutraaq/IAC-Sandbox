import { NextResponse } from "next/server";
import { QueueServiceClient } from "@azure/storage-queue";
import { DeploymentStatus } from "@prisma/client";
import db from "@/lib/db";
import { serverEnv } from "@/lib/server-env";
import { AppError, toErrorResponse } from "@/lib/errors";
import { deploymentPayloadSchema } from "@/lib/deployments/schema";
import { deriveResourceGroupName, deriveLocation } from "@/lib/deployments/rg-name";
import type { DeploymentPayload } from "@/lib/deployments/schema";

interface DeploymentJobMessage {
  submissionId: string;
  resourceGroupName: string;
  location: string;
  payload: DeploymentPayload;
  tags: Record<string, string>;
}

export async function GET() {
  try {
    const deployments = await db.deployment.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(
      deployments.map((d) => ({
        submissionId: d.id,
        mode: d.mode,
        status: d.status,
        resourceGroup: d.resourceGroup,
        errorMessage: d.errorMessage ?? null,
        createdAt: d.createdAt,
      }))
    );
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(toErrorResponse(err, crypto.randomUUID()), { status: err.statusCode });
    }
    console.error(err);
    const internal = AppError.internal();
    return NextResponse.json(toErrorResponse(internal, crypto.randomUUID()), { status: 500 });
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const err = AppError.validation("Request body must be valid JSON");
      return NextResponse.json(toErrorResponse(err, requestId), { status: 400 });
    }

    const parseResult = deploymentPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      const err = AppError.validation(
        "Request validation failed",
        parseResult.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }))
      );
      return NextResponse.json(toErrorResponse(err, requestId), { status: 400 });
    }

    const payload = parseResult.data;
    const resourceGroupName = deriveResourceGroupName(payload);
    const location = deriveLocation(payload);

    const deployment = await db.deployment.create({
      data: {
        mode: payload.mode,
        status: DeploymentStatus.accepted,
        submittedBy: "demo@sandbox.local",
        tenantId: serverEnv.AZURE_TENANT_ID,
        subscriptionId: serverEnv.AZURE_SUBSCRIPTION_ID,
        resourceGroup: resourceGroupName,
        payload: payload as Parameters<typeof db.deployment.create>[0]["data"]["payload"],
      },
    });

    const message: DeploymentJobMessage = {
      submissionId: deployment.id,
      resourceGroupName,
      location,
      payload,
      tags: payload.tags,
    };

    const queueClient = QueueServiceClient.fromConnectionString(
      serverEnv.AZURE_STORAGE_CONNECTION_STRING
    ).getQueueClient("deployment-jobs");

    await queueClient.sendMessage(
      Buffer.from(JSON.stringify(message)).toString("base64")
    );

    return NextResponse.json({ submissionId: deployment.id }, { status: 201 });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(toErrorResponse(err, requestId), { status: err.statusCode });
    }
    console.error(err);
    const internal = AppError.internal();
    return NextResponse.json(toErrorResponse(internal, requestId), { status: 500 });
  }
}
