# ACME Salary Management

Web application for ACME's HR Manager to manage salary data for 10,000 employees across countries
and answer questions about how the organisation pays people.

> Work in progress — see [`docs/PLAN.md`](docs/PLAN.md) for current phase.

## Start here

| Document | What it explains |
|---|---|
| [`REQUIREMENTS.md`](REQUIREMENTS.md) | Goal, scope, features, and what is deliberately left out |
| [`docs/PLAN.md`](docs/PLAN.md) | Phases, target structure, data model, test strategy |
| [`docs/adr/`](docs/adr/) | Architecture decisions and trade-offs |
| [`docs/ai/`](docs/ai/README.md) | How AI tools were used, with the prompt log |

## Stack

- **Backend:** Java 21, Spring Boot 3.3, PostgreSQL 16, Flyway, JPA (writes) + SQL (reads)
- **Frontend:** Next.js 14, TypeScript, TanStack Query, Tailwind, shadcn/ui, Recharts
- **Tests:** JUnit 5, Mockito, Testcontainers, ArchUnit, Vitest
