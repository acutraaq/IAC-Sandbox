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

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: ErrorDetail[]
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError("NOT_FOUND", message, 404);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError("UNAUTHORIZED", message, 401);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError("FORBIDDEN", message, 403);
  }

  static internal(message = "Internal server error"): AppError {
    return new AppError("INTERNAL_ERROR", message, 500);
  }

  static validation(message: string, details?: ErrorDetail[]): AppError {
    return new AppError("VALIDATION_ERROR", message, 400, details);
  }
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
  };
  requestId: string;
}

export function errorResponse(
  err: AppError,
  requestId: string
): ErrorResponse {
  const response: ErrorResponse = {
    error: {
      code: err.code,
      message: err.message,
    },
    requestId,
  };

  if (err.details !== undefined && err.details.length > 0) {
    response.error.details = err.details;
  }

  return response;
}
