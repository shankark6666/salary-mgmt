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
| Repudiation of salary changes | Append-only history records who, when, what and why | `salary_history.changed_by` | `salaryChangeUpdatesSalary…` |
| Exposed internals | Actuator exposes only `health` without details; API docs off unless enabled | `application.yml` | `otherActuatorEndpoints…` |
| Vulnerable dependencies / code | Dependabot weekly; CodeQL `security-extended` on every PR | `.github/` | CI |

## Deliberately out of scope (and what production would add)

| Gap | Reason | Production answer |
|---|---|---|
| SSO / MFA | Single demo organisation | Put the app behind the company IdP (OIDC) with MFA; drop local passwords |
| Per-IP rate limiting | Client IP is only trustworthy behind a known proxy | Rate-limit at the edge (CDN / WAF) |
| Distributed sessions | One instance | Spring Session (JDBC/Redis) when scaling out |
| Encryption at rest | Provided by the managed database | Verify provider encryption; consider column-level encryption for salary |
| User administration UI | Two bootstrap accounts suffice for the brief | Manage users in the IdP |
| Field-level access (e.g. hide salaries from some roles) | Both personas need salaries | Add a role without salary visibility if needed |

## Reporting

Report suspected vulnerabilities privately to the repository owner rather than in a public issue.
