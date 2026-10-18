# How AI was used

Tool: **Claude Code** (agentic coding assistant in VS Code). Conventions given to the agent live in
[`CLAUDE.md`](../../CLAUDE.md).

## Working model

- **I own the decisions; the agent accelerates the work.** Scope, architecture and trade-offs were
  decided first and written down (requirements, ADRs) so the agent works against an explicit spec.
- **Reuse a known-good architecture.** The agent was pointed at my existing Craveo codebase to
  extract its conventions, then asked to *size them down* for this problem (ADR-0004) rather
  than copy them.
- **Tests as the contract.** For domain and service code the agent writes the failing test first;
  every generated change must pass the suite before it is committed.
- **Small commits.** Each phase in [`PLAN.md`](../PLAN.md) is committed separately so the history
  shows how the solution evolved.
- **Review, don't trust.** Generated SQL aggregates are verified against hand-computed expected
  values in Testcontainers tests; money handling is checked for floating-point use.

## Prompt log

Key prompts, in order. Outputs are in the commits that follow each one.

### 1. Planning
> Here is the assessment brief [pasted]. Prepare a plan. We need to achieve it with the same
> architecture used in Craveo. Think like a senior architect. Also list what we need before starting.

The agent inspected the Craveo backend (module layout, common kernel, test stack) and admin
frontend, then proposed: keep the structural patterns, drop the infrastructure (Kafka, Redis,
GraphQL, k8s). It flagged multi-currency comparison as the central product decision.

### 2. Kick-off
> Let's create the repo and start working on it. No deadline. Use PostgreSQL.

Produced phase 1: requirements, ADRs, plan, this log.

### 3. Repository and schema
> Let's run gh auth login. / yes man

The agent ran the GitHub device-login flow, created the private repo, and implemented the Flyway
schema with Testcontainers tests.

### 4. Seed data, and moving to pull requests
> we use pull request as well

From this point every phase lands through a PR with green CI (see `CLAUDE.md` → Git workflow).

### 5. Employee module
> You can merge once CI is done.

Domain rules and use cases written test-first; then persistence, web, and full-stack tests.

### 6. Insights, and raising the security bar
> yes man make sure system will be like enterprise level software with zero attacks

The agent pushed back on "zero attacks" (no system can promise that) and proposed defence in
depth instead. It reversed the earlier decision to leave out authentication — for salary data
that was the wrong call — and scheduled a dedicated security phase straight after insights.
Insight SQL is verified against a dataset whose answers are computed by hand.

### 7. Security
Follow-through on prompt 6: identity module, session cookies + CSRF, roles, lockout, audit trail,
security headers, Dependabot + CodeQL, and `SECURITY.md` mapping every threat to the control and
the test that proves it.

### 8. Frontend shell
> continue

Next.js app mirroring Craveo's admin-app layout: token-only Tailwind, `shared/` primitives,
`modules/<feature>/{api,hooks,components,types}`. Same-origin proxy, nonce CSP, sign-in flow.

### 9. Employee screens
> ye go for it

Directory with URL-held filters, detail page with salary history, hire / edit / change-salary /
deactivate flows, role-aware actions. Verified by unit tests and by driving the production build
in headless Chrome (Playwright) at four screen widths, light and dark.

### 10. Latest package versions
> also try to use psings latest version

Ambiguous ("pnpm" or "packages"?), so the agent asked rather than guessed; the answer was latest
majors for the frontend. Done as its own PR, re-verified in the browser.

### 11. Insights dashboard
> go ahead

Built with the agent's data-visualisation skill as a procedure: form first (stat tiles, sorted
bars, histogram, range bands, diverging deviation), colour by job, palette **validated by script**
against the real card surfaces in both modes, then every page rendered and inspected at four widths.

### 12. CSV export
> yes please

Treated as the most sensitive feature (the one way the whole dataset leaves the system): manager
only, audited before the first row is sent, formula-injection safe, streamed with a row cap.
Verified by downloading through the real browser as both roles.

### 13. Release containers, and a framework migration
> don't do it [deploy], just make a release version of it, a containerized app, and do the other steps

Scanning the release image (Trivy) found 11 HIGH/CRITICAL findings. The decisive one: Spring MVC
CVEs with a fix only in Spring 7. The agent had earlier called Boot 3.5 "the supported line";
that was wrong for the current date, and it said so before proposing the Boot 4 migration,
which the user chose over a documented risk acceptance.

### 14. Wrap-up
> no we dont want to deploy lets go for remaining tasks

Architecture diagrams (Mermaid, each rendered in a browser to prove it parses), performance
notes built only from numbers measured during the project, the final README and a demo-video
script. The plan now shows planned vs actual for every phase, including the unplanned ones.

### 15. The UI framework, caught at submission time
> that was email i got [Incubyte's email: role "Software Craftsperson/Java/Angular-II"]
> why you build directly in next js i already added the points complete of assessment

The brief said *"ReactJS or NextJS. AngularJS for Java"*, and the first prompt asked to mirror
Craveo, whose UI is Next.js. Those conflicted; the agent followed Craveo **without raising the
conflict** — the exact "don't assume" failure the assessment screens for. It was caught only
when the recruiter's email named the role. The agent owned it, estimated the port (backend,
API, tests and docs unchanged), and on approval rebuilt the UI in Angular.

## Where human review changed the outcome

Things caught by checking the agent's output against reality rather than accepting it:

| What happened | How it was caught | Fix |
|---|---|---|
| A commit's POM referenced a module that only arrived in the next commit. | Built each commit in isolation before pushing. | Rebuilt the commits so each one builds. |
| Craveo's exception handler returns 400 for "not found". | Read the source before reusing it. | Each exception type owns its HTTP status. |
| The seeded app silently connected to a *different* Postgres. | Ran the real 10k seed instead of trusting the tests. | Moved compose Postgres to host port 5433. |
| Seeded salary histories had decade-long gaps without a raise. | Read sample rows the way an HR manager would. | Annual review on every anniversary, ~15% of years skipped. |
| `@Validated` on the controller would route parameter errors to a handler that returns 500. | Knew the Spring 6.1 behaviour change; controller tests assert 400. | Rely on Spring MVC's built-in method validation. |
| A clean first run of the architecture tests could mean the rules match nothing. | Introduced a deliberate Spring import into the domain. | Rule failed as expected; change reverted. |
| MapStruct carried over from Craveo by default. | Asked whether it earned its place for two mappings. | Removed; recorded in ADR-0005. |
| `.gitignore` rule `out/` (for Next.js) silently ignored the Java `port/out/` package; the local build passed because the files existed on disk. | Built every commit from a clean worktree before pushing. | Anchored the rule to `/frontend/out/`; folded the ports into their commit. |
| "No authentication" was in the original scope. | Re-read the scope against the user's enterprise-grade bar and the data's sensitivity. | Reversed in ADR-0006; sign-in, roles and audit added. |
| Craveo's JWT approach would have put tokens in browser storage. | Asked what the client actually is (browser only). | HttpOnly session cookie + CSRF instead (ADR-0006). |
| MockMvc cannot see Tomcat's cookie attributes, so cookie tests there would pass vacuously. | Asked what each test can actually observe. | Real-HTTP test against an embedded server checks `Set-Cookie`. |
| Matching Craveo meant Next 14, which `pnpm audit` showed has unpatched critical RCE/SSRF advisories. | Ran an audit before writing any code. | Next 15.5.28 (patched); deviation recorded in ADR-0004. |
| A nonce CSP only works if Next actually stamps the nonce on its scripts. | Checked a production build: all 15 script tags carry the header's nonce, and it changes per request. | — (verified, no change needed) |
| The post-login `?next=` parameter was an open-redirect vector. | Asked what a crafted link could do. | `safeNextPath`, with tests for `//host`, `https://`, backslash and `javascript:` forms. |
| A scripted browser run suggested search was broken. | Logged the real API requests before "fixing" anything. | Not a bug: the script clicked stale rows mid-refresh. No change made. |
| −43.9% salary changes went through silently. | Looked at the dialog as an HR user would. | Warning at ≥ 25% change: likely an extra or missing zero. |
| Pages scrolled sideways on phones. | Measured `scrollWidth` at 4 widths instead of eyeballing. | An `sr-only` label (absolute) escaped the table's scroll box; scroller made `relative`. Header actions now wrap. |
| jsdom lacks the `<dialog>` modal API, so dialog tests could not see buttons. | Failing tests, not a skipped assertion. | Minimal polyfill in test setup that mirrors browser `open` behaviour. |
| "Latest" TypeScript 7 and ESLint 10 are not supported by `eslint-config-next`. | Checked peer ranges before pinning. | TS 6.0 / ESLint 9.39: newest that actually work; Dependabot capped to match. |
| The React Compiler lint flagged `setState` in an effect and `watch()` defeating memoisation. | Treated as findings, not noise. | Render-time state sync; `useWatch`. One intentional `location.assign` kept, with the reason inline. |
| After the upgrade, `/icon.svg` went through the session proxy and was redirected to an https URL. | Logged failed requests in the browser run. | Proxy matcher excludes static files. |
| Each directory page prefetched all 25 employee pages. | Same failed-request log. | `prefetch={false}` on table rows. |
| Tests passed locally but failed from clean checkouts after the upgrade. | Ran every commit cold; then measured durations instead of re-running until green. | Cold start blew fixed 1s/5s budgets; set CI-sized `asyncUtilTimeout`/`testTimeout` in config, verified cold twice per commit. |
| "Latest" versions were hours old; CI's pnpm rejected them under its release-age policy. | Read the CI failure instead of disabling the check. | Kept the protection (3-day minimum, explicit in config); pinned the newest release past the cutoff. |
| A docs-only commit failed to build; rebuilds then hung. | Did not dismiss it as a flake: identical code had built a commit earlier. | `next/font/google` fetched from Google at build time; self-hosted the font from npm. |
| Chart colours could have been picked by eye. | The skill requires running the palette validator. | Validated against our actual light/dark card colours: CVD ΔE ≥ 19, normal-vision ΔE ≥ 29, contrast ≥ 3:1. |
| Per-chart filters inside one long dashboard. | Checked against the anti-pattern list. | Four sub-pages, each with one filter row scoping everything below it, held in the URL. |
| Role bands sorted by seniority read as noise. | Looked at the rendered table. | Sorted by median: a pay ladder. Scale padded so end marks are not clipped. |
| KPI tiles overflowed at 768px (₹19,68,500 in a 142px tile). | Measured which containers propagate overflow, not just which elements stick out. | Tiles three-across only from `lg`; compact payroll with the exact figure underneath. |
| Streaming set a fetch size on the shared `JdbcTemplate` — a hidden global change to every query. | Re-read the diff before running it. | A dedicated template for exports only. |
| "Can an analyst export?" — the UI hid the button, but that is not authorization. | Called the endpoint directly as an analyst in the browser test. | Server rule: export requires `HR_MANAGER` (403 otherwise), tested. |
| Boot 3.5 was described as "the supported line"; it had left open-source support. | A container scan showed Spring CVEs with no 6.2.x fix. | Migrated to Boot 4.1; Tomcat pinned to a patched release; correction recorded here and in `SECURITY.md`. |
| Module tests "compiled" after the migration because Maven reused stale classes. | A `clean` build exposed a real Spring 7 API break. | Every build since uses `clean`; noted in `CLAUDE.md`. |
| Sign-in "failed" after the migration. | Checked the server log: the request never reached the new jar. | A stale container still held port 3000; no code change needed. |
| The module diagram's dotted "forbidden" edges read as dependencies. | Rendered the diagrams and looked at them. | Removed; the boundary rules are a table under the diagram. |
| The plan claimed the demo video was "recorded". | Re-read the doc for statements that were not yet true. | Reworded: the script exists; the video is recorded from it. |
| **The UI was built in Next.js although the brief asked Java candidates for Angular.** | The user re-read the brief against the recruiter's email. | UI rebuilt in Angular; the backend and API were unaffected by design. Lesson: list every requirement and surface conflicts *before* building. |
| The route guard called `inject()` after an `await` (NG0203): the app never redirected to sign-in. | Driving the container in a browser; a new guard test reproduces it. | Inject before the first await. |
| A test kept failing after the fix. | Read the stack trace's line numbers against the file on disk. | Vitest's on-disk module cache served a stale compile; cleared, and documented in `CLAUDE.md`. |
