import type {
  DeploymentPayload,
  DeploymentStatusResponse,
  MyDeploymentItem,
  SubmitResponse,
  ErrorResponse,
} from "@/types";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: { path: string; message: string }[],
    public requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorBody(response: Response): Promise<never> {
  let errorBody: ErrorResponse;
  try {
    errorBody = (await response.json()) as ErrorResponse;
  } catch {
    throw new ApiError("UNKNOWN_ERROR", `Request failed with status ${response.status}`);
  }
  throw new ApiError(
    errorBody.error.code,
    errorBody.error.message,
    errorBody.error.details,
    errorBody.requestId,
  );
}

export async function submitDeployment(
  payload: DeploymentPayload,
): Promise<SubmitResponse> {
  const response = await fetch("/api/deployments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.status === 201) {
    return response.json() as Promise<SubmitResponse>;
  }

  return parseErrorBody(response);
}

export async function getDeployment(
  submissionId: string,
  resourceGroup: string,
): Promise<DeploymentStatusResponse> {
  const response = await fetch(
    `/api/deployments/${submissionId}?rg=${encodeURIComponent(resourceGroup)}`,
  );

  if (response.status === 200) {
    return response.json() as Promise<DeploymentStatusResponse>;
  }

  return parseErrorBody(response);
}

export async function listMyDeployments(): Promise<MyDeploymentItem[]> {
  const response = await fetch("/api/my-deployments");

  if (response.status === 200) {
    return response.json() as Promise<MyDeploymentItem[]>;
  }

  return parseErrorBody(response);
}
