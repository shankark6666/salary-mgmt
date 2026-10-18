# Changelog

## 2.0.0 — 2026-10-18

The UI is rebuilt in **Angular**, as the brief specifies for the Java track
([ADR-0007](docs/adr/0007-angular-frontend.md)). Features, API and security model are unchanged.

### Changed

- Frontend: Angular 22, Angular Material, Chart.js 4, TypeScript 6 (replaces Next.js 16 / React).
- UI container: static files on unprivileged nginx (93 MB, was 293 MB); no Node.js at runtime.
  nginx proxies `/api` and issues a per-request CSP nonce.
- CI, Dependabot and the release workflow build, test and scan the Angular app.

### Quality

- 90 frontend tests (Vitest, Angular Testing Library); browser checks of every page at four
  widths in light and dark mode: no CSP violations, no console errors, no horizontal overflow.

## 1.0.0 — 2026-10-18

First release: salary management for ACME's HR team, replacing spreadsheets.

### Features

- **Employee directory** for 10,000 people: search by name, email or code; filter by country,
  department, title and status; sort (salary compared in USD); filters held in the URL.
- **Salary records**: hire, edit details, change salary with reason and effective date,
  deactivate. Append-only salary history recording who made each change. Large changes (≥ 25%)
  are flagged as likely typos; concurrent edits are detected (optimistic locking).
- **Insights**: org totals; pay by country (local and USD); pay ladder by role within a
  country; one role compared across countries; salary distributions; outliers against the peer
  median (same role and country), skipping groups under five people.
- **CSV export** of any directory view: manager-only, audited, spreadsheet-injection safe,
  opens correctly in Excel.
- **Sign-in and roles**: HR Manager (read/write) and HR Analyst (read-only); lockout after five
  failures; HttpOnly session cookie with CSRF protection.

### Platform

- Backend: Java 21, Spring Boot 4.1, PostgreSQL 16; modular monolith with hexagonal modules.
- Frontend: Next.js 16, React 19.3, TypeScript 6, Tailwind 4.
- Release: hardened containers (non-root, read-only, capabilities dropped) started with one
  `docker compose` command; images scanned with Trivy and published with SBOM and provenance.

### Quality

- 173 backend tests (unit, web slice, Postgres via Testcontainers, architecture rules) and 87
  frontend tests; browser checks at four screen widths in light and dark mode.
- `SECURITY.md` maps every threat to its control and the test that proves it.

### Known limitations

- Not deployed to a public host; runs anywhere Docker runs.
- Single instance: sessions are in memory (a restart signs users out).
- FX rates are fixed reference values (dated 2026-10-01), not a live feed.
