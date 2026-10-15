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
