# ACME Salary Management — Requirements

## Goal

ACME's HR team manages salary data for ~10,000 employees across several countries in Excel. Edits
are error-prone, history is lost when a cell is overwritten, and answering "how do we pay people?"
means building a pivot table by hand every time.

Replace the spreadsheets with a web application in which the **HR Manager** can
1. **maintain** employee salary data reliably, and
2. **answer questions** about how the organisation pays people — without exporting to Excel first.

Success looks like: the HR Manager can find any employee in seconds, change a salary with a reason
that is never lost, and answer the questions below from a single screen.

## Questions the product must answer

- What do we pay for a given role in each country (min / median / average / max)?
- How does pay for the same role compare across countries, in one currency?
- How is pay distributed within a country — where are most people?
- Who is paid well outside the norm for their role and country?
- How has an individual's salary changed over time, and why?

## Scope & features

| # | Feature | Notes |
|---|---|---|
| F1 | **Employee directory** | Server-side pagination, search by name/email, filter by country / department / job title, sort by any column. |
| F2 | **Create / edit / deactivate employee** | Validated forms. Deactivation is a soft delete — history is never destroyed. |
| F3 | **Salary change with history** | Every salary change records old value, new value, effective date and reason. Viewable per employee. |
| F4 | **Country pay overview** | Headcount and min / median / average / max per country, in local currency and in USD. |
| F5 | **Role drill-down** | The same statistics per job title within a country, and per job title across countries (USD). |
| F6 | **Pay distribution** | Histogram of salaries for a selected country. |
| F7 | **Outliers** | Employees whose salary differs from the median for their role + country by more than a chosen threshold. |
| F8 | **CSV export** | Export any filtered directory view — HR still has a path back to Excel when they need one. |
| F9 | **Seed data** | Deterministic script producing 10,000 realistic employees. |

### Key product decision: money across countries

Salaries are stored in the employee's **local currency** as exact decimals — that is what the
contract says and what payroll pays. Cross-country comparison converts to **USD using a reference
FX-rate table** maintained in the database. Within a single country, figures are always shown in
local currency so HR never sees a number that shifted because an exchange rate moved.
(See [ADR-0003](docs/adr/0003-currency-handling.md).)

## Deliberately left out

| Left out | Reasoning |
|---|---|
| Authentication / role-based access | One persona (HR Manager). Real deployment would sit behind the company SSO; building a bespoke login adds surface area without answering any of the questions above. First item to add if time allows. |
| Payroll, tax, payslips | A different product with country-specific legal rules. This tool manages *compensation data*, not *payment*. |
| Live FX rates | Pay comparison needs stable, explainable numbers. A reference table is auditable; a live feed makes reports change daily. |
| Approval workflows | A single HR Manager is the decision maker for this release. |
| Bulk Excel import | The obvious next feature for a team leaving Excel, but import validation and reconciliation (duplicates, partial failures) deserves its own design. CSV export ships now. |
| Pay-equity analysis by gender / ethnicity | Requires collecting sensitive personal data; needs a privacy and legal decision first, not an engineering one. |
| Bonuses, equity, benefits | Base salary first; total compensation is a later extension of the same model. |
| Multi-tenancy | Built for ACME only. |

## Non-functional requirements

- **Performance:** directory pages < 200 ms, insight queries < 300 ms at 10,000 employees.
- **Correctness:** money is never stored as floating point; aggregates are computed in SQL.
- **Auditability:** salary history is append-only.
- **Quality:** fast, deterministic unit tests for the core logic; CI runs the full suite on every push.
- **Deployability:** one command to run locally; publicly deployed demo.
