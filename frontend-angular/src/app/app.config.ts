import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { csrfRetryInterceptor, sessionAndErrorInterceptor } from './core/api/interceptors';
import { provideIcons } from './core/icons/icons';
import { AppPaginatorIntl } from './core/paginator-intl';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      // Same cookie and header names the Spring Security policy uses (ADR-0006). Angular adds
      // the header to same-origin writes only.
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      // Order matters: errors flow back inside-out, so the CSRF retry (inner) sees the raw
      // HTTP error before the outer interceptor turns it into an ApiError.
      withInterceptors([sessionAndErrorInterceptor, csrfRetryInterceptor]),
    ),
    provideIcons(),
    { provide: MatPaginatorIntl, useClass: AppPaginatorIntl },
  ],
};
