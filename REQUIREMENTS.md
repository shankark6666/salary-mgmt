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
| F8 | **CSV export** | Export any filtered directory view — HR still has a path back to Excel when they need one. Managers only, audited, spreadsheet-injection safe, opens correctly in Excel (UTF-8 BOM). |
| F9 | **Seed data** | Deterministic script producing 10,000 realistic employees. |
| F10 | **Sign-in and roles** | HR Manager (read/write) and HR Analyst (read-only). Lockout after repeated failures. Every salary change records who made it. Added after the first draft: salary data is too sensitive to serve without it — see [`SECURITY.md`](SECURITY.md). |

### Key product decision: money across countries

Salaries are stored in the employee's **local currency** as exact decimals — that is what the
contract says and what payroll pays. Cross-country comparison converts to **USD using a reference
FX-rate table** maintained in the database. Within a single country, figures are always shown in
local currency so HR never sees a number that shifted because an exchange rate moved.
(See [ADR-0003](docs/adr/0003-currency-handling.md).)

## Deliberately left out

| Left out | Reasoning |
|---|---|
| Payroll, tax, payslips | A different product with country-specific legal rules. This tool manages *compensation data*, not *payment*. |
| Live FX rates | Pay comparison needs stable, explainable numbers. A reference table is auditable; a live feed makes reports change daily. |
| Approval workflows | A single HR Manager is the decision maker for this release. |
| Bulk Excel import | The obvious next feature for a team leaving Excel, but import validation and reconciliation (duplicates, partial failures) deserves its own design. CSV export ships now. |
| Pay-equity analysis by gender / ethnicity | Requires collecting sensitive personal data; needs a privacy and legal decision first, not an engineering one. |
| Bonuses, equity, benefits | Base salary first; total compensation is a later extension of the same model. |
| Multi-tenancy | Built for ACME only. |
| SSO / MFA and user administration | Two bootstrap accounts cover the brief. In production the app would sit behind the company identity provider, which owns MFA and joiners/leavers. |
| Relocation between countries | Moving country changes the salary's currency, so it needs its own flow (new salary in the new currency, effective date). Country and hire date are therefore fixed after hiring; a relocation is modelled as deactivate + new hire for now. |
| Future-dated salary changes | Changes take effect on or before today. Scheduling raises needs a job to apply them and a way to show "pending"; not needed to answer the questions above. |

## Technology constraints from the brief

- **Backend:** Java (the role's language) with a relational database — Spring Boot and
  PostgreSQL.
- **UI:** the brief specifies *"ReactJS or NextJS. AngularJS for Java"*. This is a Java/Angular
  role, so the UI is **Angular**. "AngularJS" (1.x) reached end of life in January 2022 and
  receives no security fixes, so this is read as modern Angular, the framework the role names.
  (The first UI was built in Next.js, following an instruction to mirror an existing project;
  that conflicted with the brief and has been replaced — see
  [ADR-0007](docs/adr/0007-angular-frontend.md) and the AI log.)

## Non-functional requirements

- **Performance:** directory pages < 200 ms, insight queries < 300 ms at 10,000 employees.
- **Correctness:** money is never stored as floating point; aggregates are computed in SQL.
- **Auditability:** salary history is append-only.
- **Quality:** fast, deterministic unit tests for the core logic; CI runs the full suite on every push.
- **Deployability:** one command to run locally; publicly deployed demo.
