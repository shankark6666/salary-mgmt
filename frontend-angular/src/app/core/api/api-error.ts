import { HttpErrorResponse } from '@angular/common/http';
import type { ApiEnvelope } from './api.types';

/** A failed API call, reduced to what the UI needs to react to it. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isConflict(): boolean {
    return this.status === 409;
  }
}

const NETWORK_MESSAGE = 'Cannot reach the server. Check your connection and try again.';
const GENERIC_MESSAGE = 'Something went wrong. Please try again.';

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return new ApiError(0, 'NETWORK_ERROR', NETWORK_MESSAGE);
    }
    // Only trust the body when it is our envelope; proxies return HTML pages on 502 etc.
    const body = typeof error.error === 'object' && error.error !== null
      ? (error.error as Partial<ApiEnvelope<unknown>>)
      : undefined;
    return new ApiError(
      error.status,
      body?.errorCode ?? 'UNKNOWN_ERROR',
      body?.message ?? GENERIC_MESSAGE,
      body?.fieldErrors ?? {},
    );
  }
  return new ApiError(0, 'UNKNOWN_ERROR', GENERIC_MESSAGE);
}
