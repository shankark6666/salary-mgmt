import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError, toApiError } from "@shared/api/errors";

/**
 * Puts the server's per-field errors on the matching inputs and returns the message to show
 * for everything else. Client validation mirrors the server's, but the server always has the
 * final say (e.g. "email already in use").
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[]
): string | null {
  const apiError: ApiError = toApiError(error);
  let unmatched = false;
  for (const [field, message] of Object.entries(apiError.fieldErrors)) {
    if ((fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: "server", message });
    } else {
      unmatched = true;
    }
  }
  if (apiError.code === "VALIDATION_FAILED" && !unmatched && Object.keys(apiError.fieldErrors).length > 0) {
    return null;
  }
  return apiError.message;
}
