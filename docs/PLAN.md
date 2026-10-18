# Implementation Plan

Each phase is one or a few small commits. Tests land with (or before) the code they cover.

The original plan, with what actually happened. Deviations are deliberate and explained in the
linked PRs, ADRs and the [AI log](ai/README.md).

| # | Phase | Planned | Outcome |
|---|---|---|---|
| 1 | Docs first | `REQUIREMENTS.md`, ADRs, this plan, `CLAUDE.md`, AI usage log | ✅ First commit |
| 2 | Backend skeleton | Parent POM, `salary-common`, `salary-app`, docker-compose Postgres, health, CI | ✅ |
| 3 | Schema | Flyway migrations for reference data, employees, salary history | ✅ |
| 4 | Seeder | Deterministic 10,000-employee seed + test | ✅ #1 — 10k employees + 69k history rows in ~3 s |
| 5 | Employee module | Domain + service tests first; CRUD, search, filter, sort, pagination | ✅ #2 |
| 6 | Salary history | Append-only history; history endpoint | ✅ Folded into #2 |
| 7 | Insights module | Country stats, role drill-down, histogram, outliers | ✅ #3 |
| — | *Security (unplanned)* | *Not in the original plan: auth was "left out"* | ✅ #4 — reversed on review: sign-in, roles, CSRF, lockout, audit ([ADR-0006](adr/0006-session-authentication.md)) |
| 8 | Frontend skeleton | Next.js 14, API client, layout, tokens, shadcn/ui | ✅ #11 — Next 15 (14 had unpatched CVEs), native dialog/select instead of shadcn |
| 9 | Employees UI | Table + filters, forms, salary-history drawer | ✅ #18 — history on a detail page rather than a drawer |
| — | *Latest versions (unplanned)* | | ✅ #19 — Next 16, React 19.3, Tailwind 4, zod 4, pnpm 12 with a release-age policy |
| 10 | Insights UI | Country comparison, role drill-down, histogram, outliers | ✅ #21 — four filterable sub-pages, validated palette |
| 11 | CSV export & polish | Export endpoint; empty / loading / error states | ✅ #23 — manager-only, audited, formula-injection safe |
| 12 | Deploy | Neon + Render + Vercel | ↪ **Not deployed by decision**; replaced by a hardened containerised release (one `docker compose` command) |
| — | *Spring Boot 4 (unplanned)* | | ✅ #24 — Boot 3.5 had left OSS support; container scan found Spring CVEs fixed only in Spring 7 |
| 13 | Wrap-up | Performance notes, architecture diagram, README, demo video | ✅ [`architecture.md`](architecture.md), [`performance.md`](performance.md), [`demo-script.md`](demo-script.md) (the video is recorded from that script) |
| — | *Angular UI (unplanned)* | | ✅ #40–#43 — the brief names Angular for the Java track; the Next.js UI was rebuilt in Angular against the unchanged API ([ADR-0007](adr/0007-angular-frontend.md)) |

## Target structure

```
salary-mgmt/
├── backend/
│   ├── salary-common/      response envelope, exceptions, global error handler
│   ├── salary-employee/    employees + salary history (hexagonal)
│   ├── salary-insights/    read-side analytics (SQL)
│   └── salary-app/         Spring Boot launcher, Flyway, seeder, config
├── frontend/               Angular 22 + Angular Material, served by nginx
│   └── src/app/{core, features/{auth,employees,insights,reference}, shared}
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
| SQL / API | Testcontainers Postgres | Read-model SQL, constraints, median/percentiles, FX conversion on small known datasets |
| Architecture | ArchUnit | Layer and module boundaries |
| Frontend | Vitest + Angular Testing Library | Form validation, filter ↔ query mapping, table states |
