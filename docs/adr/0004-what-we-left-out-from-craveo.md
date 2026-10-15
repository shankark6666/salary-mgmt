# ADR-0004: What we keep — and drop — from the Craveo architecture

**Status:** Accepted

## Context

Craveo is a food-delivery platform with many bounded contexts, real-time traffic and payments.
Its architecture carries infrastructure sized for that. This product has one persona and
10,000 rows. Copying the infrastructure would add cost without adding value.

## Decision

| Craveo element | Here | Reason |
|---|---|---|
| Maven modular monolith | Keep | Clear boundaries, one deployable |
| Hexagonal layers per module | Keep | Fast unit tests, framework-free domain |
| Shared `common` kernel (response envelope, exceptions, global handler) | Keep, slimmed | Consistent API contract |
| PostgreSQL + Flyway | Keep | See ADR-0002 |
| Lombok | Keep | Less boilerplate on entities |
| MapStruct | **Drop** (revised) | Only two small mappings; hand-written is clearer (ADR-0005) |
| ArchUnit, Testcontainers, `@WebMvcTest` | Keep | Enforced boundaries; real-DB SQL tests; thin web tests |
| Next.js admin app layout (`modules/<feature>/{api,hooks,components,types}`) | Keep | Feature-sliced frontend |
| TanStack Query, axios, react-hook-form + zod, Tailwind tokens | Keep | Same conventions |
| Next.js 14 | **Upgrade to 15.5** | 14.x is out of support; `pnpm audit` showed unpatched critical advisories (RCE in image optimisation, SSRF in rewrites) fixed only in ≥ 15.5.24 |
| Radix-style headless components | **Native `<dialog>` / `<select>`** | Browser-provided focus trapping and keyboard support, zero dependencies |
| Kafka + transactional outbox | **Drop** | No cross-service consumers; a DB transaction is enough |
| Redis cache | **Drop** | Aggregates over 10k rows take milliseconds in Postgres |
| GraphQL | **Drop** | A handful of REST endpoints serve one UI |
| Cursor pagination | **Drop** | Offset pagination is fine at 10k rows and supports "jump to page" |
| Idempotency keys | **Drop** | Single interactive user; forms are guarded client-side |
| Kubernetes, Jenkins | **Drop** | Docker image on a PaaS + GitHub Actions |

## When to revisit

- **Redis:** insight queries exceed ~300 ms (roughly 1M+ employees or heavy concurrent use).
- **Cursor pagination:** deep paging over very large result sets.
- **Events/outbox:** another system (payroll, HRIS) needs to react to salary changes.
