# CLAUDE.md — conventions for AI agents working in this repo

Read `REQUIREMENTS.md`, `docs/PLAN.md` and `docs/adr/` before changing behaviour.

## Backend (`backend/`, Java 21, Spring Boot 3.3, Maven multi-module)

- Modules: `salary-common`, `salary-employee`, `salary-insights`, `salary-app`.
- Package layout inside a domain module:
  `domain` · `application.port.in` · `application.port.out` · `application.service` ·
  `adapter.in.web` (+ `dto`) · `infrastructure.persistence`.
- `domain` has no Spring or JPA imports. JPA entities live in `infrastructure.persistence` and
  are mapped to domain objects by hand in the persistence adapter.
- Reads that serve screens go through a read-model port implemented in SQL (ADR-0005). Sort
  columns come from a closed enum; user input only reaches bind parameters.
- Controllers depend on `port.in` interfaces, never on services or repositories directly.
- `salary-insights` must not import `salary-employee` internals (enforced by ArchUnit).
- Money: `BigDecimal` / `NUMERIC(14,2)` only. Never `double` or `float`.
- Errors: throw exceptions from `salary-common`; `GlobalExceptionHandler` maps them to the
  `ApiResponse` error envelope.
- Schema changes go in a new Flyway migration; never edit an applied one.

## Frontend (`frontend/`, Next.js 16 App Router, React 19, TypeScript 6, Tailwind 4)

- Feature code in `src/modules/<feature>/{api,hooks,components,types}`; cross-feature code in
  `src/shared`.
- Server state via TanStack Query hooks; forms via react-hook-form + zod.
- Colours come from tokens in `globals.css` (`@theme inline`) — no hardcoded hex or Tailwind palette classes.
- Forms: `useForm<Input, unknown, Output>` with zod 4 schemas; read live values with `useWatch`, not `watch`.
- Page-level request logic lives in `src/proxy.ts` (Next 16's replacement for middleware).

## Tests

- Unit tests must be fast and deterministic: no sleeps, no wall-clock, no random without a seed.
- Write the failing test first for domain and service logic.
- SQL aggregates are tested against Postgres via Testcontainers with small, hand-checked datasets.
- `mvn verify` and `pnpm test` must pass before committing.

## Git workflow

- Never commit to `main` directly. One branch per phase / feature: `feat/<name>`, `fix/<name>`,
  `docs/<name>`.
- Small commits, one concern each, imperative mood (`Add salary history endpoint`). Each commit
  must build and pass tests on its own.
- Open a pull request into `main` with: what changed, why, how it was verified.
- Merge only when CI is green. Merge with a merge commit (not squash) so the incremental commit
  history stays visible.
