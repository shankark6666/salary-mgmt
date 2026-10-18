import { HttpErrorResponse } from '@angular/common/http';
import { ApiError, toApiError } from './api-error';

const httpError = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

describe('toApiError', () => {
  it("keeps the backend's code, message and field errors", () => {
    const error = toApiError(httpError(400, {
      success: false,
      errorCode: 'VALIDATION_FAILED',
      message: 'Request validation failed',
      fieldErrors: { email: 'must be a well-formed email address' },
    }));

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.fieldErrors['email']).toBe('must be a well-formed email address');
  });

  it('flags 409 as a conflict', () => {
    expect(toApiError(httpError(409, { errorCode: 'CONFLICT', message: 'x' })).isConflict).toBe(true);
  });

  it('explains network failures in plain words', () => {
    const error = toApiError(httpError(0, new ProgressEvent('error')));

    expect(error.code).toBe('NETWORK_ERROR');
    expect(error.message).toMatch(/cannot reach the server/i);
  });

  it('never surfaces raw non-envelope bodies', () => {
    expect(toApiError(httpError(502, '<html>Bad gateway</html>')).message)
      .toBe('Something went wrong. Please try again.');
  });
});
