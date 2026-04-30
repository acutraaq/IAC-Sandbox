import { NextResponse } from "next/server";
import { QueueServiceClient } from "@azure/storage-queue";
import { serverEnv } from "@/lib/server-env";
import { AppError, toErrorResponse, logError } from "@/lib/errors";
import { deploymentPayloadSchema } from "@/lib/deployments/schema";
import { deriveResourceGroupName, deriveLocation } from "@/lib/deployments/rg-name";
import { validateDeploymentPolicy } from "@/lib/deployments/policy";
import { getCurrentUser } from "@/lib/auth";
import type { DeploymentPayload } from "@/lib/deployments/schema";

// Must match deploymentJobMessageSchema in functions/src/functions/processDeployment.ts
interface DeploymentJobMessage {
  submissionId: string;
  resourceGroupName: string;
  location: string;
  payload: DeploymentPayload;
  tags: Record<string, string>;
  deployedBy: string;
}

const QUEUE_NAME = "deployment-jobs";

function getQueueClient() {
  return QueueServiceClient.fromConnectionString(
    serverEnv.AZURE_STORAGE_CONNECTION_STRING
  ).getQueueClient(QUEUE_NAME);
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

    const user = await getCurrentUser();
    if (!user) {
      const err = AppError.unauthorized();
      return NextResponse.json(toErrorResponse(err, requestId), { status: err.statusCode });
    }

    const policyViolation = validateDeploymentPolicy(payload);
    if (policyViolation) {
      const err = AppError.forbidden(
        `Deployment blocked by subscription policy. Not permitted: ${policyViolation.blocked.join(", ")}`
      );
      return NextResponse.json(toErrorResponse(err, requestId), { status: err.statusCode });
    }

    const submissionId = crypto.randomUUID();
    const resourceGroupName = deriveResourceGroupName(payload);
    const location = deriveLocation(payload);

    const message: DeploymentJobMessage = {
      submissionId,
      resourceGroupName,
      location,
      payload,
      tags: payload.tags,
      deployedBy: user.upn,
    };

    await getQueueClient().sendMessage(
      Buffer.from(JSON.stringify(message)).toString("base64")
    );

    return NextResponse.json({ submissionId, resourceGroup: resourceGroupName }, { status: 201 });
  } catch (err) {
    if (err instanceof AppError) {
      return NextResponse.json(toErrorResponse(err, requestId), { status: err.statusCode });
    }
    logError("POST /api/deployments", requestId, err);
    const internal = AppError.internal();
    return NextResponse.json(toErrorResponse(internal, requestId), { status: 500 });
  }
}
