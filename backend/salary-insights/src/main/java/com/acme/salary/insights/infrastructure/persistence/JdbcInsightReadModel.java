package com.acme.salary.insights.infrastructure.persistence;

import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.insights.application.model.CountryPayStats;
import com.acme.salary.insights.application.model.OutlierCriteria;
import com.acme.salary.insights.application.model.PayOutlier;
import com.acme.salary.insights.application.model.RoleCountryComparison;
import com.acme.salary.insights.application.model.RolePayStats;
import com.acme.salary.insights.application.port.out.InsightReadModel;
import com.acme.salary.insights.domain.SalaryScale;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Pay analytics as SQL aggregates. Postgres computes medians and percentiles exactly
 * ({@code percentile_cont}), so nothing is approximated or pulled into memory.
 *
 * <p>{@code percentile_cont} works in double precision; results are cast back to numeric and
 * rounded to cents, which is exact for amounts within NUMERIC(14,2).
 */
@Repository
class JdbcInsightReadModel implements InsightReadModel {

    private static final String ACTIVE_WITH_FX = """
            FROM employees e
            JOIN countries c ON c.code = e.country_code
            JOIN fx_rates  r ON r.currency_code = c.currency_code
            WHERE e.active
            """;

    private final NamedParameterJdbcTemplate jdbc;

    JdbcInsightReadModel(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Country> findCountry(String code) {
        return jdbc.query("SELECT code, name, currency_code FROM countries WHERE code = :code",
                Map.of("code", code),
                (rs, i) -> new Country(rs.getString("code"), rs.getString("name"),
                        rs.getString("currency_code"))).stream().findFirst();
    }

    @Override
    public Optional<JobTitle> findJobTitle(int id) {
        return jdbc.query("SELECT id, name FROM job_titles WHERE id = :id", Map.of("id", id),
                (rs, i) -> new JobTitle(rs.getInt("id"), rs.getString("name"))).stream().findFirst();
    }

    @Override
    public LocalDate fxRatesAsOf() {
        return jdbc.getJdbcTemplate().queryForObject("SELECT max(as_of) FROM fx_rates", LocalDate.class);
    }

    @Override
    public OrgTotals orgTotals() {
        return jdbc.queryForObject("""
                SELECT count(*) AS headcount,
                       coalesce(round(sum(e.salary * r.usd_rate), 2), 0) AS payroll_usd,
                       round(percentile_cont(0.5) WITHIN GROUP (ORDER BY e.salary * r.usd_rate)::numeric, 2)
                           AS median_usd
                """ + ACTIVE_WITH_FX, Map.of(),
                (rs, i) -> new OrgTotals(rs.getLong("headcount"), rs.getBigDecimal("payroll_usd"),
                        rs.getBigDecimal("median_usd")));
    }

    @Override
    public List<CountryPayStats> payByCountry() {
        return jdbc.query("""
                WITH stats AS (
                    SELECT c.code, c.name, c.currency_code, r.usd_rate,
                           count(*) AS headcount,
                           min(e.salary) AS min,
                           percentile_cont(0.5) WITHIN GROUP (ORDER BY e.salary)::numeric AS median,
                           avg(e.salary) AS average,
                           max(e.salary) AS max,
                           sum(e.salary) AS total
                """ + ACTIVE_WITH_FX + """
                    GROUP BY c.code, c.name, c.currency_code, r.usd_rate
                )
                SELECT code, name, currency_code, headcount, min, max,
                       round(median, 2) AS median,
                       round(average, 2) AS average,
                       round(median * usd_rate, 2) AS median_usd,
                       round(average * usd_rate, 2) AS average_usd,
                       round(total * usd_rate, 2) AS payroll_usd
                FROM stats
                ORDER BY payroll_usd DESC, code
                """, Map.of(), (rs, i) -> new CountryPayStats(
                rs.getString("code"), rs.getString("name"), rs.getString("currency_code"),
                rs.getLong("headcount"), rs.getBigDecimal("min"), rs.getBigDecimal("median"),
                rs.getBigDecimal("average"), rs.getBigDecimal("max"),
                rs.getBigDecimal("median_usd"), rs.getBigDecimal("average_usd"),
                rs.getBigDecimal("payroll_usd")));
    }

    @Override
    public List<RolePayStats> payByRole(String countryCode) {
        return jdbc.query("""
                SELECT t.id, t.name, t.level,
                       count(*) AS headcount,
                       min(e.salary) AS min,
                       round(percentile_cont(0.25) WITHIN GROUP (ORDER BY e.salary)::numeric, 2) AS p25,
                       round(percentile_cont(0.50) WITHIN GROUP (ORDER BY e.salary)::numeric, 2) AS median,
                       round(percentile_cont(0.75) WITHIN GROUP (ORDER BY e.salary)::numeric, 2) AS p75,
                       max(e.salary) AS max
                FROM employees e
                JOIN job_titles t ON t.id = e.job_title_id
                WHERE e.active AND e.country_code = :countryCode
                GROUP BY t.id, t.name, t.level
                ORDER BY t.level, t.name
                """, Map.of("countryCode", countryCode), (rs, i) -> new RolePayStats(
                rs.getInt("id"), rs.getString("name"), rs.getInt("level"), rs.getLong("headcount"),
                rs.getBigDecimal("min"), rs.getBigDecimal("p25"), rs.getBigDecimal("median"),
                rs.getBigDecimal("p75"), rs.getBigDecimal("max")));
    }

    @Override
    public List<RoleCountryComparison.Row> roleAcrossCountries(int jobTitleId) {
        return jdbc.query("""
                WITH stats AS (
                    SELECT c.code, c.name, c.currency_code, r.usd_rate,
                           count(*) AS headcount,
                           percentile_cont(0.25) WITHIN GROUP (ORDER BY e.salary)::numeric AS p25,
                           percentile_cont(0.50) WITHIN GROUP (ORDER BY e.salary)::numeric AS p50,
                           percentile_cont(0.75) WITHIN GROUP (ORDER BY e.salary)::numeric AS p75
                """ + ACTIVE_WITH_FX + """
                      AND e.job_title_id = :jobTitleId
                    GROUP BY c.code, c.name, c.currency_code, r.usd_rate
                )
                SELECT code, name, currency_code, headcount,
                       round(p50, 2) AS median_local,
                       round(p25 * usd_rate, 2) AS p25_usd,
                       round(p50 * usd_rate, 2) AS median_usd,
                       round(p75 * usd_rate, 2) AS p75_usd
                FROM stats
                ORDER BY median_usd DESC, code
                """, Map.of("jobTitleId", jobTitleId), (rs, i) -> new RoleCountryComparison.Row(
                rs.getString("code"), rs.getString("name"), rs.getString("currency_code"),
                rs.getLong("headcount"), rs.getBigDecimal("median_local"),
                rs.getBigDecimal("p25_usd"), rs.getBigDecimal("median_usd"),
                rs.getBigDecimal("p75_usd")));
    }

    @Override
    public SalaryRange salaryRange(String countryCode) {
        return jdbc.queryForObject("""
                SELECT count(*) AS headcount, min(salary) AS min, max(salary) AS max
                FROM employees WHERE active AND country_code = :countryCode
                """, Map.of("countryCode", countryCode),
                (rs, i) -> new SalaryRange(rs.getLong("headcount"), rs.getBigDecimal("min"),
                        rs.getBigDecimal("max")));
    }

    @Override
    public Map<Integer, Long> bucketCounts(String countryCode, SalaryScale scale) {
        Map<Integer, Long> counts = new HashMap<>();
        jdbc.query("""
                SELECT floor((salary - :start) / :width)::int AS bucket, count(*) AS headcount
                FROM employees
                WHERE active AND country_code = :countryCode
                GROUP BY bucket
                """, new MapSqlParameterSource()
                        .addValue("start", scale.start())
                        .addValue("width", scale.width())
                        .addValue("countryCode", countryCode),
                rs -> { counts.put(rs.getInt("bucket"), rs.getLong("headcount")); });
        return counts;
    }

    @Override
    public PagedResponse<PayOutlier> outliers(OutlierCriteria criteria) {
        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("minPeers", OutlierCriteria.MIN_PEER_GROUP)
                .addValue("threshold", criteria.thresholdPercent());
        StringBuilder filters = new StringBuilder();
        if (criteria.countryCode() != null) {
            filters.append(" AND e.country_code = :countryCode");
            params.addValue("countryCode", criteria.countryCode());
        }
        if (criteria.jobTitleId() != null) {
            filters.append(" AND e.job_title_id = :jobTitleId");
            params.addValue("jobTitleId", criteria.jobTitleId());
        }

        // Peer group = active employees with the same country and job title.
        String flagged = """
                WITH peers AS (
                    SELECT country_code, job_title_id, count(*) AS peer_count,
                           percentile_cont(0.5) WITHIN GROUP (ORDER BY salary)::numeric AS peer_median
                    FROM employees
                    WHERE active
                    GROUP BY country_code, job_title_id
                    HAVING count(*) >= :minPeers
                ),
                flagged AS (
                    SELECT e.id, e.employee_code, e.full_name, e.country_code, c.currency_code,
                           e.job_title_id, t.name AS job_title_name, e.salary, p.peer_count,
                           round(p.peer_median, 2) AS peer_median,
                           round((e.salary - p.peer_median) / p.peer_median * 100, 1) AS deviation_percent
                    FROM employees e
                    JOIN peers p      ON p.country_code = e.country_code AND p.job_title_id = e.job_title_id
                    JOIN countries c  ON c.code = e.country_code
                    JOIN job_titles t ON t.id = e.job_title_id
                    WHERE e.active
                      AND abs(e.salary - p.peer_median) / p.peer_median * 100 >= :threshold
                """ + filters + """
                )
                """;

        Long total = jdbc.queryForObject(flagged + "SELECT count(*) FROM flagged", params, Long.class);

        params.addValue("limit", criteria.size());
        params.addValue("offset", (long) criteria.page() * criteria.size());
        List<PayOutlier> content = jdbc.query(flagged + """
                SELECT * FROM flagged
                ORDER BY abs(deviation_percent) DESC, id
                LIMIT :limit OFFSET :offset
                """, params, (rs, i) -> new PayOutlier(
                rs.getLong("id"), rs.getString("employee_code"), rs.getString("full_name"),
                rs.getString("country_code"), rs.getString("currency_code"),
                rs.getInt("job_title_id"), rs.getString("job_title_name"),
                rs.getBigDecimal("salary"), rs.getBigDecimal("peer_median"),
                rs.getBigDecimal("deviation_percent"), rs.getLong("peer_count")));

        long totalElements = total == null ? 0 : total;
        int totalPages = (int) ((totalElements + criteria.size() - 1) / criteria.size());
        return new PagedResponse<>(content, criteria.page(), criteria.size(), totalElements, totalPages);
    }
}
