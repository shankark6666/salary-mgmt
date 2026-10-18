# ADR-0007: Angular for the frontend

**Status:** Accepted (supersedes the frontend rows of [ADR-0004](0004-what-we-left-out-from-craveo.md))

## Context

The brief lists the UI options as *"ReactJS or NextJS. AngularJS for Java"*. The role is a Java
and Angular position, so the Java track's option applies: Angular.

The first UI was built in Next.js, because the plan mirrored Craveo, whose admin app is Next.js.
That followed the reference project instead of the brief. It was caught after the backend,
the full UI and the release were done, and the UI was rebuilt in Angular in four pull
requests (#40–#43) against the unchanged API.

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

- Same API, behaviour and security model as before; the backend did not change.
- The UI image went from 293 MB (Node standalone server) to 93 MB (nginx and static files),
  and the runtime has no package manager or JavaScript engine to abuse.
- Session-based route protection moved from server middleware to a route guard plus the API's
  own 401s. The guard is a convenience; the API remains the security boundary.
- Angular packages must move together, so Dependabot groups them into one PR.
