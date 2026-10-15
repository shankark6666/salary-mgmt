# ADR-0005: JPA for writes, SQL for reads

**Status:** Accepted

## Context

Writes and reads of employee data have opposite needs.

- **Writes** change one employee at a time and must respect business rules (salary history,
  read-only inactive employees) and concurrent edits.
- **Reads** serve the directory: join four tables, convert salary to USD, search by substring,
  filter, sort by any column — including USD salary, a computed value — and page.

Doing reads through JPA entities would mean either lazy associations (N+1 queries per page) or
fetch joins with Specifications, plus no clean way to sort by a computed expression.

## Decision

- **Write side:** domain `Employee` ↔ JPA entities via `EmployeePersistenceAdapter`.
  `@Version` provides optimistic locking; `SalaryHistoryEntity` is `@Immutable`.
- **Read side:** `EmployeeReadModel` port implemented by `JdbcEmployeeReadModel` — one SQL query
  per page, built from a fixed fragment set. User input only ever reaches bind parameters; sort
  columns come from a closed enum mapped to fixed SQL.
- Both run in the same transaction and database. This is a code-organisation split, not
  separate stores: no eventual consistency to reason about.
- Mapping between domain and entity is hand-written (two short methods). MapStruct, used in
  Craveo, was removed: the domain object is built through a factory, and generated code would
  be harder to read than the mapping itself.

## Consequences

- Directory queries over 10,000 employees measured at 5–45 ms locally, warm.
- Two models of an employee (domain + view). Accepted: they change for different reasons.
- Read SQL is verified against real Postgres in `EmployeeApiIntegrationTest`, including the
  USD-based sort and LIKE-wildcard escaping.
