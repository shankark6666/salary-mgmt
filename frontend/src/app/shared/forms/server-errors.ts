import { FormGroup } from '@angular/forms';
import { toApiError } from '../../core/api/api-error';

/**
 * Puts the server's per-field errors on the matching controls and returns the message to show
 * for everything else (e.g. "email already in use", a conflict, a network failure).
 */
export function applyServerErrors(error: unknown, form: FormGroup): string | null {
  const apiError = toApiError(error);
  let unmatched = false;
  for (const [field, message] of Object.entries(apiError.fieldErrors)) {
    const control = form.get(field);
    if (control) {
      control.setErrors({ server: { message } });
      control.markAsTouched();
    } else {
      unmatched = true;
    }
  }
  const allMatched = apiError.code === 'VALIDATION_FAILED' && !unmatched && Object.keys(apiError.fieldErrors).length > 0;
  return allMatched ? null : apiError.message;
}
