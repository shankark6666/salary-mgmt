# Demo video script (~6 minutes)

A walkthrough for recording the demo. Each section names what to click and the one sentence
worth saying. Times are targets, not limits.

## Before recording

```bash
cp .env.example .env            # set passwords (≥ 12 characters)
docker compose -f compose.release.yml up -d --build
open http://localhost:3000
```

- Browser at 1440×900, zoom 100%, light mode. Close other tabs and notifications.
- Have a second browser profile (or private window) ready for the analyst account.
- Optional: a terminal with the repo open, for the last section.

---

## 0:00 — The problem (20 s)

> "ACME's HR team manages salaries for 10,000 people in 9 countries in spreadsheets. This
> replaces them: maintain salary data safely, and answer how the company pays people."

Show the sign-in page.

## 0:20 — Sign in, roles (30 s)

1. Sign in as the **manager**.
2. Point at the sidebar badge: *Manager*.

> "Two roles: managers change data, analysts only read. Sessions use an HttpOnly cookie with
> CSRF protection; five wrong passwords lock the account for 15 minutes."

## 0:50 — Insights overview (60 s)

1. **Overview**: the three tiles (headcount, payroll, median), then *Median salary by country*.
2. Hover a bar to show the tooltip (USD plus local currency).
3. Scroll to the table: local currency, ranges, payroll.

> "Salaries are stored in local currency, exactly what people are paid, and converted to USD
> only for comparison, using dated reference rates."

## 1:50 — Answering real questions (90 s)

1. **By country → India**: the histogram in ₹5 L bands, then *Pay by role*.
   > "Roles sorted by median read as a pay ladder; each band is the middle half of salaries."
2. **Role comparison → Senior Software Engineer**: one role across nine countries in USD.
   > "What do we pay a senior engineer in the US versus India? $157k versus $35k at the median."
3. **Outliers → 25%**: the list, the diverging bars.
   > "People paid far from colleagues with the same role and country. Groups under five people
   > are skipped, because there the median is one person's pay."
4. Click a name; it opens their record.

## 3:20 — Maintaining salary data (75 s)

1. On the employee page: current salary (local + USD) and the **salary history** with *Recorded by*.
2. **Change salary**: type an amount; the % preview appears. Type an amount with an extra zero:
   > "A change of more than 25% gets a warning. The usual mistake is a zero too many."
3. Correct it, pick *Promotion*, **Record change**. The new history row shows your username.
4. **Employees** directory: search "sharma", filter India, sort by salary.
   > "Filters live in the URL, so a view can be shared or bookmarked. Salary sorts by USD."

## 4:35 — Export (30 s)

1. **Export CSV**; open the file in Excel or Numbers.
   > "Exactly what was on screen, opened correctly in Excel. Export is manager-only and every
   > export is audited, because it is the one way the whole dataset leaves the system."

## 5:05 — Read-only analyst (25 s)

1. Switch to the analyst window, signed in as the analyst.
2. Same pages, no *Add*, *Change salary* or *Export* buttons.
   > "And it is enforced on the server: calling the export URL directly returns 403."

## 5:30 — How it was built (30 s)

Show the repository on GitHub:

1. The **pull request list**: every phase merged through a PR with green CI.
2. `docs/ai/README.md` → *Where human review changed the outcome*.
   > "AI wrote much of the code. This table is where checking its work against reality changed
   > the result: security gaps, a framework that had gone out of support, layout bugs."
3. `SECURITY.md` and `docs/architecture.md`, briefly.

**End (~6:00).**
