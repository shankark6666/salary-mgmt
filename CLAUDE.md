# CLAUDE.md — conventions for AI agents working in this repo

Read `REQUIREMENTS.md`, `docs/PLAN.md` and `docs/adr/` before changing behaviour.

## Backend (`backend/`, Java 21, Spring Boot 4.1, Maven multi-module)

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
- Boot 4 test slices live in `org.springframework.boot.webmvc.test.autoconfigure`; JSON is Jackson 3
  (`tools.jackson.*`, annotations still `com.fasterxml.jackson.annotation`). Build with `clean`:
  stale `target/` classes have hidden real compile errors twice in this project.

## Frontend (`frontend/`, Angular 22, Angular Material, Node 24)

- Standalone components, signals, zoneless, `OnPush`. Features in `src/app/features/<feature>`,
  cross-cutting code in `src/app/core` (API, auth, icons) and `src/app/shared`.
- HTTP: `HttpClient` with Angular's built-in XSRF (`XSRF-TOKEN` / `X-XSRF-TOKEN`); interceptor
  order matters (error mapping outer, CSRF retry inner). Pages read data with `httpResource`.
- `inject()` only before the first `await` in guards/functions (NG0203 otherwise).
- CSP: nginx puts a per-request nonce into `ngCspNonce`; no `unsafe-inline`, no sanitizer
  bypass (lint-enforced; the one allow-listed exception is the icon resolver).
- If a test result contradicts the source, clear `node_modules/.vitest-cache` and
  `.angular/cache`: Vitest's module cache once served a stale compile here.

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
