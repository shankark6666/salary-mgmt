# ADR-0006: Server-side sessions with HttpOnly cookies, not JWT

**Status:** Accepted (reverses the "no authentication" scope decision in the first requirements draft)

## Context

The first draft left authentication out to save time. On review that was wrong for this domain:
a deployed URL would expose 10,000 salaries to anyone who found it. The UI is a browser app
and the API serves only that UI.

Craveo uses JWTs because it serves mobile apps. For a browser-only client, JWTs are usually kept
in JavaScript-readable storage, where any XSS bug can steal them, and they cannot be revoked
before expiry without extra infrastructure.

## Decision

- Spring Security with **server-side sessions**; the browser holds only an opaque session id in
  a cookie that is `HttpOnly`, `Secure` and `SameSite=Strict`.
- **CSRF tokens** on every state-changing request (cookie-to-header pattern for SPAs), in
  addition to SameSite — two independent defences.
- The UI calls the API **same-origin** through a reverse proxy, so no CORS policy exists to get
  wrong and cookies never travel cross-site.
- Two roles: `HR_MANAGER` (read/write) and `HR_ANALYST` (read-only). Authorization is enforced
  per HTTP method in one place, deny-by-default.
- A separate `salary-identity` module owns accounts and the security policy. Business modules
  learn who is acting only through a port (`CurrentActor`); ArchUnit forbids them from importing
  Spring Security.

## Consequences

- Sign-out is immediate (session invalidated server-side).
- Sessions are in memory: a restart signs everyone out, and scaling beyond one instance needs
  Spring Session. Acceptable for one HR team; noted in `SECURITY.md`.
- Every write from the UI must send the `X-XSRF-TOKEN` header — handled once in the API client.
