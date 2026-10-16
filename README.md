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
| [`SECURITY.md`](SECURITY.md) | Threat model: every threat, its control, and the test that proves it |

## Screens

| Insights overview | Pay by country (India) |
|---|---|
| ![overview](docs/screenshots/insights-overview.png) | ![country](docs/screenshots/insights-country.png) |

| Role comparison (dark) | Outliers |
|---|---|
| ![roles](docs/screenshots/insights-role-comparison-dark.png) | ![outliers](docs/screenshots/insights-outliers.png) |

| Employee directory | Employee detail |
|---|---|
| ![directory](docs/screenshots/employee-directory.png) | ![detail](docs/screenshots/employee-detail.png) |

## Run locally

Prerequisites: Java 21+, Docker, Node 22, pnpm 12.

```bash
docker compose up -d postgres                      # Postgres 16 on localhost:5433
cp .env.example .env                               # then choose your own passwords
set -a; source .env; set +a
(cd backend && ./mvnw -q -pl salary-app -am spring-boot:run)   # API on :8080, seeds 10k employees
(cd frontend && pnpm install && pnpm dev)          # UI on http://localhost:3000
```

Sign in with the `BOOTSTRAP_MANAGER_*` credentials from `.env`. The UI proxies `/api` to the
backend, so both run on one origin.

## Stack

- **Backend:** Java 21, Spring Boot 3.3, PostgreSQL 16, Flyway, JPA (writes) + SQL (reads)
- **Frontend:** Next.js 16, React 19.3, TypeScript 6, TanStack Query, react-hook-form + zod 4, Tailwind 4, Recharts 3
- **Tests:** JUnit 5, Mockito, Testcontainers, ArchUnit, Vitest + Testing Library
