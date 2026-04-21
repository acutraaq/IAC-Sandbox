import type { DeploymentPayload, DeploymentStatusResponse, SubmitResponse, ErrorResponse } from "@/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

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
  const response = await fetch(`${API_URL}/deployments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 201) {
    return response.json() as Promise<SubmitResponse>;
  }

  return parseErrorBody(response);
}

export async function getDeployment(
  submissionId: string,
): Promise<DeploymentStatusResponse> {
  const response = await fetch(`${API_URL}/deployments/${submissionId}`);

  if (response.status === 200) {
    return response.json() as Promise<DeploymentStatusResponse>;
  }

  return parseErrorBody(response);
}
