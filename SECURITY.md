# Security

Salary data is among the most sensitive data a company holds. This document is the threat model:
what the system defends against, how, and what is deliberately out of scope.

No system is "attack-proof". The goal is **defence in depth** — independent layers, so a single
mistake does not become a breach — and making every security decision explicit and tested.

## Assets and actors

| Asset | Why it matters |
|---|---|
| Salaries and salary history | Confidential; leaks harm employees and the company |
| Employee personal data (name, email) | Personal data |
| HR accounts | Whoever holds one can read or change pay |

| Actor | Can |
|---|---|
| Anonymous internet user | Reach the login endpoint and health check only |
| HR Analyst | Read the directory and insights; change nothing |
| HR Manager | Read and change employee and salary data |

## Controls

| Threat | Control | Where | Verified by |
|---|---|---|---|
| Unauthenticated access | Deny-by-default filter chain; only login, CSRF bootstrap and health are public | `SecurityConfig` | `SecurityIntegrationTest` |
| Privilege escalation | Reads need `HR_ANALYST`/`HR_MANAGER`; every write needs `HR_MANAGER` | `SecurityConfig` | `analystCanReadButNotChangeAnything` |
| Password guessing | Account locks for 15 min after 5 failures; lock not extended by retries | `UserAccount` | `UserAccountTest`, `fiveWrongPasswordsLock…` |
| Username enumeration | Identical response and one password hash on every failure path | `AccountAuthenticationProvider` | `wrongPasswordAndUnknownUserAreIndistinguishable` |
| Password theft from DB | bcrypt (adaptive), `{id}`-prefixed for future algorithm upgrades; min 12 chars | `SecurityConfig`, `UserBootstrap` | — |
| Default / committed credentials | First accounts come only from environment variables; startup fails without them | `UserBootstrap` | — |
| Session theft via XSS | Session cookie is `HttpOnly`; no tokens in `localStorage` | `application.yml` | `SessionCookieIntegrationTest` |
| Session theft in transit | Cookie `Secure`; HSTS (1 year) | `application.yml`, `SecurityConfig` | `SessionCookieIntegrationTest`, `responsesCarryProtectiveHeaders` |
| Session fixation | Session id replaced at sign-in | `AuthController` | `sessionIdIsReplacedAtSignIn…` |
| CSRF | `SameSite=Strict` cookies **and** a CSRF token on every write, sign-in and sign-out | `SecurityConfig` | `writesWithoutCsrfToken…`, `signInRequiresCsrfToken` |
| Cross-origin reads | No CORS configuration: browsers refuse cross-origin calls; UI is same-origin via proxy | `SecurityConfig` | `crossOriginRequestsGetNoCorsGrant` |
| Clickjacking, MIME sniffing, content injection | `X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, CSP `default-src 'none'` | `SecurityConfig` | `responsesCarryProtectiveHeaders` |
| SQL injection | Every query uses bind parameters; sort columns come from a closed enum; LIKE input escaped | `Jdbc*ReadModel` | `likeWildcardsInSearch…`, `unknownSortField…` |
| Unbounded queries (resource exhaustion) | Page size ≤ 100, bounded thresholds and bucket counts, 16 KB header limit | Controllers, `application.yml` | `pageSizeIsCapped`, `bucketCountIsBounded` |
| Information leakage in errors | Uniform error envelope; no stack traces, SQL or constraint names | `GlobalExceptionHandler` | `GlobalExceptionHandlerTest` |
| Lost or silent edits | Optimistic locking; 409 on stale versions | Employee module | `staleVersionIsRejected…` |
| Bulk data exfiltration | CSV export is **manager-only** (analysts can view, not bulk-download), capped at 100,000 rows, and every export is written to `audit_events` (who, filters, row count) before the first row leaves | `SecurityConfig`, `EmployeeExportService` | `bulkExportIsForManagersOnly…`, `everyExportIsAuditedWithWhoAndWhat` |
| CSV / formula injection | Cells starting with `= + - @`, tab or CR are prefixed with `'` (OWASP), so a name like `=HYPERLINK(...)` cannot execute when HR opens the file | `CsvWriter` | `CsvWriterTest`, `neutralisesSpreadsheetFormulasInNames` |
| Repudiation of salary changes | Append-only history records who, when, what and why | `salary_history.changed_by` | `salaryChangeUpdatesSalary…` |
| Exposed internals | Actuator exposes only `health` without details; API docs off unless enabled | `application.yml` | `otherActuatorEndpoints…` |
| Vulnerable dependencies / code | Dependabot weekly (Maven, npm, Actions); CodeQL `security-extended` on every PR; CI fails on high/critical advisories in shipped frontend code | `.github/` | CI |
| Malicious install scripts (npm supply chain) | pnpm 12 fails the install if any dependency not on the allow-list (`esbuild`, `@parcel/watcher`) tries to run a script | `frontend/pnpm-workspace.yaml` | CI install |
| Container breakout / lateral movement | Non-root user, read-only root filesystem, all Linux capabilities dropped, `no-new-privileges`, memory limits; only the UI port is published (API and database are internal to the compose network) | `compose.release.yml`, Dockerfiles | Verified on the running release |
| Tools for an attacker inside the UI container | The UI image is nginx and static files only: no Node.js, no package manager | `frontend/Dockerfile` | Image scan |
| Vulnerable images | CI builds both release images and fails on any fixable HIGH/CRITICAL finding (Trivy); Dependabot tracks base images | `.github/workflows/ci.yml` | CI `containers` job |
| Hijacked CI actions | Third-party GitHub Actions pinned to full commit SHAs, not movable tags | `.github/workflows/ci.yml` | — |
| Third-party fetches at build time and runtime | Font and icons self-hosted from npm packages (`@fontsource-variable/inter`, `lucide-static`); the page loads nothing from other origins | `angular.json`, `styles.scss` | CSP `default-src 'self'` |
| Hijacked fresh releases (npm supply chain) | `minimumReleaseAge`: no package version younger than 3 days is installed, directly or transitively | `frontend/pnpm-workspace.yaml` | CI `--frozen-lockfile` install |
| XSS in the UI | Angular template escaping and sanitisation; lint rule bans `bypassSecurityTrust*` (one reviewed exception: the allow-listed icon resolver); per-request nonce CSP with `strict-dynamic` and no `unsafe-inline`, so injected scripts and styles do not run | `nginx/default.conf.template`, `index.html` (`ngCspNonce`), `eslint.config.mjs` | Browser checks report CSP violations: zero on every page |
| Open redirect via `?next=` | Only same-site paths honoured after sign-in | `safe-next-path.ts` | `safe-next-path.spec.ts`, `login.page.spec.ts` |
| Data left behind on shared machines | Sign-out ends the server session, then fully reloads the page so nothing from the session stays in memory | `shell.ts` | Browser check: `/me` returns 401 after sign-out |
| Search-engine exposure | `noindex, nofollow` on every page | `index.html` | — |

## Deliberately out of scope (and what production would add)

| Gap | Reason | Production answer |
|---|---|---|
| SSO / MFA | Single demo organisation | Put the app behind the company IdP (OIDC) with MFA; drop local passwords |
| Per-IP rate limiting | Client IP is only trustworthy behind a known proxy | Rate-limit at the edge (CDN / WAF) |
| Distributed sessions | One instance | Spring Session (JDBC/Redis) when scaling out |
| Encryption at rest | Provided by the managed database | Verify provider encryption; consider column-level encryption for salary |
| User administration UI | Two bootstrap accounts suffice for the brief | Manage users in the IdP |
| Field-level access (e.g. hide salaries from some roles) | Both personas need salaries | Add a role without salary visibility if needed |

## Framework support windows

Patching only works while the framework still ships patches. Spring Boot 3.5 / Spring
Framework 6.2 left open-source support in 2026; a scan of the release image then found two
CRITICAL Spring MVC advisories with no 6.2 fix. The backend was migrated to Spring Boot 4.1
(Spring 7). Tomcat is pinned one patch ahead of Boot (`tomcat.version`) when Boot's managed
version lags a security release. Container scanning in CI (Trivy) is what surfaces this.

## Accepted dependency advisories

`pnpm audit --prod` reports nothing. One development-only advisory remains with no fix
available; it affects a tool that reads only this repository's own file paths, never user input:

| Package | Via | Why accepted |
|---|---|---|
| `braces` (high, ReDoS) | ESLint file globbing | No patched release exists; inputs are our file paths |

## Reporting

Report suspected vulnerabilities privately to the repository owner rather than in a public issue.
