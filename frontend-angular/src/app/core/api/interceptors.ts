import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { toApiError } from './api-error';

const RETRIED = 'X-Csrf-Retried';

/**
 * CSRF tokens expire with the session's token rotation. If the backend says the token is
 * invalid, fetch a fresh one and retry the request once.
 */
export const csrfRetryInterceptor: HttpInterceptorFn = (request, next) => {
  const http = inject(HttpClient);
  return next(request).pipe(
    catchError((error: unknown) => {
      if (isCsrfFailure(error) && !request.headers.has(RETRIED)) {
        return http.get('/api/v1/auth/csrf').pipe(
          switchMap(() => next(request.clone({ setHeaders: { [RETRIED]: '1' } }))),
        );
      }
      return throwError(() => error);
    }),
  );
};

/**
 * A 401 outside the auth endpoints means the session expired mid-use: send the user to sign
 * in, then back. A full page load on purpose — it wipes every in-memory salary figure.
 * All other failures are normalised to ApiError for components.
 */
export const sessionAndErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint(request)) {
        const here = window.location.pathname + window.location.search;
        window.location.assign(`/login?next=${encodeURIComponent(here)}`);
      }
      return throwError(() => toApiError(error));
    }),
  );

function isCsrfFailure(error: unknown): boolean {
  return error instanceof HttpErrorResponse
    && error.status === 403
    && (error.error as { errorCode?: string } | null)?.errorCode === 'CSRF_INVALID';
}

function isAuthEndpoint(request: HttpRequest<unknown>): boolean {
  return request.url.startsWith('/api/v1/auth/');
}
