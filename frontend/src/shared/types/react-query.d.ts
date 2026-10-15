import type { ApiError } from "@shared/api/errors";

// The API client rejects only with ApiError, so every query and mutation error carries
// status, code and field errors.
declare module "@tanstack/react-query" {
  interface Register {
    defaultError: ApiError;
  }
}
