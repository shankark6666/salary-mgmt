# ADR-0007: Angular for the frontend

**Status:** Accepted

## Context

The brief lists the UI options as *"ReactJS or NextJS. AngularJS for Java"*. The role is a Java
and Angular position, so the Java track's option applies: Angular. Craveo, the reference
architecture for the backend (ADR-0001, ADR-0004), uses a different frontend stack, so its
backend structure is reused but its UI stack is not.

"AngularJS" (1.x) reached end of life in January 2022 and gets no security fixes. Shipping it
would contradict the security posture of the rest of the system, so the brief is read as
modern Angular.

## Decision

- **Angular 22** with Angular Material: standalone components, signals, zoneless change
  detection, `OnPush` everywhere.
- **Data:** `HttpClient` + `httpResource` through one small `apiResource` helper (unwraps the
  API envelope, keeps the previous value while reloading, normalises errors). Angular's
  built-in XSRF support sends `X-XSRF-TOKEN`; one interceptor retries once with a fresh token.
- **Forms:** typed reactive forms with small, unit-tested validators; server field errors are
  mapped back onto the form controls.
- **Charts:** Chart.js behind one `app-chart` component. Chart configurations are pure
  functions with unit tests; every chart has a table with the same numbers.
- **Serving:** the production build is static files served by unprivileged nginx, which also
  proxies `/api` to the backend, so the browser sees a single origin (ADR-0006). nginx puts a
  per-request nonce into the page for the CSP (`ngCspNonce`). There is no Node.js at runtime.
- **Tests:** Vitest through the Angular CLI with Testing Library; `HttpTestingController` for
  pages that load data.

## Consequences

- The UI image is nginx and static files (93 MB): no Node.js, package manager or JavaScript
  engine at runtime for an attacker to use.
- Route protection is a client-side guard plus the API's own 401s. The guard is a convenience;
  the API remains the security boundary.
- Angular packages must move together, so Dependabot groups them into one PR, and TypeScript
  stays within the compiler's supported range.
