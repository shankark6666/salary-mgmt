# ADR-0003: Store salaries in local currency, compare in USD

**Status:** Accepted

## Context

Employees are paid in their country's currency. HR needs both exact per-country figures and
cross-country comparison ("Senior Engineer in India vs Germany").

## Options

1. Store everything in USD — loses the contractual figure; numbers drift as rates change.
2. Store local currency only — cannot compare across countries.
3. **Store local currency, convert to USD at query time using a reference FX table.**

## Decision

Option 3.

- `employees.salary` is `NUMERIC(14,2)` in the employee's currency; the currency is derived from
  the employee's country (one currency per country), so the two can never disagree.
- `fx_rates(currency_code, usd_rate)` holds a reference rate per currency, seeded with fixed values.
- Single-country views show local currency. Cross-country views show USD and label it as such.
- Java uses `BigDecimal` end to end; floating point never touches money.

## Consequences

- The API returns money as JSON numbers. A double round-trips any decimal of up to 15
  significant digits and `NUMERIC(14,2)` has at most 14, so values display exactly. The frontend
  only formats money; it never does arithmetic on it.
- Cross-country figures depend on the reference rates; the UI states the rates' as-of date.
- Updating a rate is a data change, not a code change.
