import { AxiosError } from "axios";
import type { ApiEnvelope } from "@shared/types/api.types";

/** A failed API call, reduced to what the UI needs to react to it. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: Record<string, string> = {}
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isConflict() {
    return this.status === 409;
  }
}

const NETWORK_MESSAGE = "Cannot reach the server. Check your connection and try again.";

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof AxiosError) {
    const body = error.response?.data as Partial<ApiEnvelope<unknown>> | undefined;
    if (!error.response) {
      return new ApiError(0, "NETWORK_ERROR", NETWORK_MESSAGE);
    }
    return new ApiError(
      error.response.status,
      body?.errorCode ?? "UNKNOWN_ERROR",
      body?.message ?? "Something went wrong. Please try again.",
      body?.fieldErrors ?? {}
    );
  }
  return new ApiError(0, "UNKNOWN_ERROR", "Something went wrong. Please try again.");
}
