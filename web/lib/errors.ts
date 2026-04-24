export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INTERNAL_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT";

export interface ErrorDetail {
  path: string;
  message: string;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: ErrorDetail[];

  constructor(code: ErrorCode, message: string, statusCode: number, details?: ErrorDetail[]) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError("NOT_FOUND", message, 404);
  }

  static validation(message: string, details?: ErrorDetail[]): AppError {
    return new AppError("VALIDATION_ERROR", message, 400, details);
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError("INTERNAL_ERROR", message, 500);
  }

  static forbidden(message: string): AppError {
    return new AppError("FORBIDDEN", message, 403);
  }
}

export function toErrorResponse(err: AppError, requestId: string) {
  const body: { error: { code: string; message: string; details?: ErrorDetail[] }; requestId: string } = {
    error: { code: err.code, message: err.message },
    requestId,
  };
  if (err.details && err.details.length > 0) {
    body.error.details = err.details;
  }
  return body;
}
