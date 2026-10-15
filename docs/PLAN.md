# Implementation Plan

Each phase is one or a few small commits. Tests land with (or before) the code they cover.

| # | Phase | Output |
|---|---|---|
| 1 | Docs first | `REQUIREMENTS.md`, ADRs, this plan, `CLAUDE.md`, AI usage log |
| 2 | Backend skeleton | Parent POM, `salary-common`, `salary-app`, docker-compose Postgres, health endpoint, CI |
| 3 | Schema | Flyway migrations: countries, fx_rates, departments, job_titles, employees, salary_history |
| 4 | Seeder | Deterministic 10,000-employee seed (fixed RNG, JDBC batches) + test |
| 5 | Employee module | Domain + service tests first; CRUD, search, filter, sort, pagination |
| 6 | Salary history | Update-salary use case writes append-only history; history endpoint |
| 7 | Insights module | Country stats, role drill-down, histogram, outliers; Testcontainers SQL tests; ArchUnit |
| 8 | Frontend skeleton | Next.js 14, shared API client, layout, design tokens, shadcn/ui |
| 9 | Employees UI | Table + filters, create/edit form, salary-history drawer |
| 10 | Insights UI | Country comparison, role drill-down, histogram, outliers (Recharts) |
| 11 | CSV export & polish | Export endpoint; empty / loading / error states |
| 12 | Deploy | Postgres (Neon), backend container (Render), frontend (Vercel); seed prod |
| 13 | Wrap-up | Performance notes, architecture diagram, README, demo video |

## Target structure

```
salary-mgmt/
├── backend/
│   ├── salary-common/      response envelope, exceptions, global error handler
│   ├── salary-employee/    employees + salary history (hexagonal)
│   ├── salary-insights/    read-side analytics (SQL)
│   └── salary-app/         Spring Boot launcher, Flyway, seeder, config
├── frontend/               Next.js 14 (App Router)
│   └── src/{app, modules/{employees,insights}, shared}
└── docs/                   ADRs, plan, AI usage, performance notes
```

## Data model (initial)

```
countries      (code PK, name, currency_code)
fx_rates       (currency_code PK, usd_rate NUMERIC, as_of DATE)
departments    (id PK, name UNIQUE)
job_titles     (id PK, name UNIQUE, level)
employees      (id PK, employee_code UNIQUE, full_name, email UNIQUE,
                country_code FK, department_id FK, job_title_id FK,
                employment_type, hire_date, salary NUMERIC(14,2),
                active, created_at, updated_at, version)
salary_history (id PK, employee_id FK, previous_salary, new_salary,
                effective_date, reason, changed_at)
```

Indexes: `employees(country_code, job_title_id)`, `employees(department_id)`,
`lower(full_name)`, `salary_history(employee_id, effective_date DESC)`.

## Test strategy

| Layer | Tool | Covers |
|---|---|---|
| Domain | JUnit 5 + AssertJ | Validation, salary-change rules, outlier maths |
| Application | Mockito | Use-case orchestration, history writes |
| Web | `@WebMvcTest` | Request validation, error envelope, paging params |
| SQL / insights | Testcontainers Postgres | Median, percentiles, FX conversion on a small known dataset |
| Architecture | ArchUnit | Layer and module boundaries |
| Frontend | Vitest + Testing Library | Form validation, filter ↔ query mapping, table states |
