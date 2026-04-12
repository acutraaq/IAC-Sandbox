import type { DeploymentPayload, SubmitResponse, ErrorResponse } from "@/types";

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

  const errorBody = (await response.json()) as ErrorResponse;
  throw new ApiError(
    errorBody.error.code,
    errorBody.error.message,
    errorBody.error.details,
    errorBody.requestId,
  );
}
