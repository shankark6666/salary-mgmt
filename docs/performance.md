# Performance

What the system does at ACME's size (10,000 employees), why it is fast, and where it would
stop being fast. Every number below was measured, not estimated.

**Environment:** MacBook (Apple silicon), Postgres 16 in local Docker, production builds of
both apps, warm caches, 10,000 seeded employees with ~69,000 salary-history rows. Timings are
end-to-end HTTP through the UI's proxy unless noted.

## Measured

| Operation | Result |
|---|---|
| Seed 10,000 employees + 69,242 history rows | **3.2 s** (one transaction, JDBC batches of 1,000, `reWriteBatchedInserts`) |
| Directory, page 1 | 28 ms |
| Directory sorted by USD salary | 36 ms |
| Directory search "sharma" (trigram index) | 43 ms |
| Directory, country + department filter | 9 ms |
| Directory, page 400 (deep offset) | 31 ms |
| Employee / salary history / reference data | 5–6 ms |
| Insights overview (org + 9 countries, medians) | 42 ms |
| Pay by role in a country (quartiles) | 19 ms |
| One role across countries (USD quartiles) | 16 ms |
| Salary distribution (histogram) | 17 ms |
| Outliers at 30% (peer medians for every role × country) | 60 ms |
| **CSV export, whole workforce** (10,004 rows, 1.3 MB) | **0.36 s** |
| Backend startup | ~7 s (unloaded machine) |
| Frontend production build | ~4 s (Angular CLI / esbuild); 157 kB initial transfer, pages lazy-loaded |
| Release images | backend 415 MB · frontend 93 MB (nginx + static files) |
| Test suites | backend 173 tests ~2 min (incl. Postgres container) · frontend 90 tests ~5 s |

## Why it is fast

- **Aggregation happens in Postgres.** Medians and quartiles use `percentile_cont`; histograms
  bucket in SQL; outliers compute peer medians in one CTE. Nothing loads 10,000 rows into Java
  to count them.
- **One query per screen.** The directory read model joins employees, countries, FX rates,
  departments and titles and computes the USD equivalent in a single round trip: no N+1, no
  lazy loading ([ADR-0005](adr/0005-separate-read-and-write-paths.md)).
- **Indexes match the questions.** `(country_code, job_title_id) WHERE active` for insights;
  GIN trigram indexes on name and email for "contains" search; `lower(email)` unique index;
  `(employee_id, effective_date DESC)` for history.
- **Streaming export.** CSV rows go out as Postgres returns them (cursor, fetch size 500), so
  memory stays flat regardless of export size; capped at 100,000 rows.
- **Bounded requests.** Page size ≤ 100, histogram buckets ≤ 50, thresholds from a fixed list:
  no request can ask the database for unbounded work.
- **Frontend.** Previous results stay on screen (dimmed) while the next page loads; search is
  debounced (300 ms); reference data is loaded once per session; pages are lazy-loaded, so
  the first load ships only the shell (157 kB compressed).

## Deliberately not done (and when it would be)

| Not done | Why not now | Add it when |
|---|---|---|
| Cache (Redis) | Every insight query is under 60 ms over 10k rows | Insight queries exceed ~300 ms, roughly 1M employees or heavy concurrency |
| Materialised views for insights | Same | Aggregates get slow; refresh on salary change |
| Cursor (keyset) pagination | Offset is fine at 10k (page 400 in 31 ms) and supports "jump to page" | Deep paging over millions of rows |
| Read replica | One HR team | Reporting load competes with writes |
| Horizontal scaling | One instance serves the team | Then sessions move to Spring Session (JDBC/Redis); the app is otherwise stateless |

## Scaling notes

- The heaviest query is **outliers**: it computes a median for every (country, role) group. At
  10k employees that is ~150 groups. It grows with groups, not rows, and would be the first
  candidate for a materialised view.
- `salary_history` grows about 7 rows per employee over a decade; it is only ever read per
  employee through its index.
- Money is `NUMERIC(14,2)` end to end and JSON numbers stay within 15 significant digits, so
  there is no precision cost to correctness ([ADR-0003](adr/0003-currency-handling.md)).
