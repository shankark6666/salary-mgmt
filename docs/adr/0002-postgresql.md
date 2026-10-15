# ADR-0002: PostgreSQL with Flyway

**Status:** Accepted

## Context

The brief allows any relational database (SQLite suggested). The core of the product is
aggregation: medians, percentiles and histograms per country and role.

## Decision

Use **PostgreSQL 16**, schema managed by **Flyway** migrations.

- `percentile_cont` gives exact medians in SQL; SQLite would need medians computed in application
  code or emulated with window functions.
- `width_bucket` gives histograms in one query.
- `NUMERIC` gives exact money arithmetic.
- Managed free tiers (Neon / Render) make deployment straightforward.
- Integration tests run against real Postgres via **Testcontainers**, so the SQL we test is the SQL
  we ship.

## Consequences

- Docker is required to run integration tests locally (unit tests do not need it).
- Local development uses `docker compose up postgres`.
