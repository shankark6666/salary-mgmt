# ADR-0001: Modular monolith with hexagonal modules

**Status:** Accepted

## Context

The backend has two clearly different concerns:

- **Employee management** — write-heavy, rule-heavy (validation, salary history).
- **Insights** — read-only aggregation across the whole dataset.

There is one team, one deployable and 10,000 rows. The architecture follows the one I use on
Craveo (a production-style food-delivery backend), sized down to this problem.

## Decision

- A **Maven multi-module monolith**: `salary-common`, `salary-employee`, `salary-insights`,
  `salary-app` (launcher, configuration, migrations, seeder).
- Inside each domain module, **ports and adapters**:

  ```
  domain/                       plain Java, no Spring / JPA
  application/port/in           use-case interfaces
  application/port/out          what the use case needs from the outside (repository ports)
  application/service           use-case implementations
  adapter/in/web                REST controllers + DTOs
  infrastructure/persistence    JPA entities, Spring Data repositories, port adapters
  ```

- `salary-insights` never reaches into `salary-employee`'s internals; it reads through its own
  query port backed by SQL. Boundaries are enforced by **ArchUnit** tests, not by convention.

## Consequences

- Domain rules and use cases are unit-tested with plain JUnit + Mockito — no Spring context, no DB.
- Modules could be split into services later without rewriting business logic; we explicitly do
  **not** do that now (one deployable is cheaper to build, test and operate).
- Slightly more files than a flat `controller/service/repository` layout. Accepted: the structure
  is what keeps tests fast and boundaries honest.
