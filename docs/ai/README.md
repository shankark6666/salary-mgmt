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
