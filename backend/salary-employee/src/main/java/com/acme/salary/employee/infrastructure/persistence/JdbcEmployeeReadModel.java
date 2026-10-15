package com.acme.salary.employee.infrastructure.persistence;

import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.employee.application.model.EmployeeSearchCriteria;
import com.acme.salary.employee.application.model.EmployeeSortField;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.model.SalaryHistoryEntry;
import com.acme.salary.employee.application.port.out.EmployeeReadModel;
import com.acme.salary.employee.domain.EmploymentType;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Directory queries in plain SQL (ADR-0005): one round trip joins everything the screen shows,
 * computes the USD equivalent, and filters, sorts and pages in the database.
 */
@Repository
class JdbcEmployeeReadModel implements EmployeeReadModel {

    private static final String SELECT_VIEW = """
            SELECT e.id, e.employee_code, e.full_name, e.email,
                   e.country_code, c.name AS country_name, c.currency_code,
                   e.department_id, d.name AS department_name,
                   e.job_title_id, t.name AS job_title_name,
                   e.employment_type, e.hire_date, e.salary,
                   round(e.salary * r.usd_rate, 2) AS salary_usd,
                   e.active, e.version
            """;

    private static final String FROM_JOINED = """
            FROM employees e
            JOIN countries   c ON c.code = e.country_code
            JOIN fx_rates    r ON r.currency_code = c.currency_code
            JOIN departments d ON d.id = e.department_id
            JOIN job_titles  t ON t.id = e.job_title_id
            """;

    /** The only strings that ever reach ORDER BY. */
    private static final Map<EmployeeSortField, String> ORDER_BY = Map.of(
            EmployeeSortField.NAME, "e.full_name",
            EmployeeSortField.EMPLOYEE_CODE, "e.employee_code",
            EmployeeSortField.EMAIL, "e.email",
            EmployeeSortField.COUNTRY, "c.name",
            EmployeeSortField.DEPARTMENT, "d.name",
            EmployeeSortField.JOB_TITLE, "t.name",
            EmployeeSortField.HIRE_DATE, "e.hire_date",
            EmployeeSortField.SALARY_USD, "salary_usd");

    private static final RowMapper<EmployeeView> VIEW_MAPPER = (rs, rowNum) -> new EmployeeView(
            rs.getLong("id"),
            rs.getString("employee_code"),
            rs.getString("full_name"),
            rs.getString("email"),
            rs.getString("country_code"),
            rs.getString("country_name"),
            rs.getString("currency_code"),
            rs.getInt("department_id"),
            rs.getString("department_name"),
            rs.getInt("job_title_id"),
            rs.getString("job_title_name"),
            EmploymentType.valueOf(rs.getString("employment_type")),
            rs.getObject("hire_date", java.time.LocalDate.class),
            rs.getBigDecimal("salary"),
            rs.getBigDecimal("salary_usd"),
            rs.getBoolean("active"),
            rs.getLong("version"));

    private final NamedParameterJdbcTemplate jdbc;

    JdbcEmployeeReadModel(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public PagedResponse<EmployeeView> search(EmployeeSearchCriteria criteria) {
        MapSqlParameterSource params = new MapSqlParameterSource();
        String where = whereClause(criteria, params);

        Long total = jdbc.queryForObject("SELECT count(*) " + FROM_JOINED + where, params, Long.class);

        params.addValue("limit", criteria.size());
        params.addValue("offset", (long) criteria.page() * criteria.size());
        String orderBy = " ORDER BY %s %s NULLS LAST, e.id %s".formatted(
                ORDER_BY.get(criteria.sort()), criteria.direction(), criteria.direction());
        List<EmployeeView> content = jdbc.query(
                SELECT_VIEW + FROM_JOINED + where + orderBy + " LIMIT :limit OFFSET :offset",
                params, VIEW_MAPPER);

        long totalElements = total == null ? 0 : total;
        int totalPages = (int) ((totalElements + criteria.size() - 1) / criteria.size());
        return new PagedResponse<>(content, criteria.page(), criteria.size(), totalElements,
                totalPages);
    }

    @Override
    public Optional<EmployeeView> findById(long id) {
        return jdbc.query(SELECT_VIEW + FROM_JOINED + " WHERE e.id = :id",
                Map.of("id", id), VIEW_MAPPER).stream().findFirst();
    }

    @Override
    public List<SalaryHistoryEntry> salaryHistory(long employeeId) {
        return jdbc.query("""
                SELECT id, previous_salary, new_salary, effective_date, reason, changed_by, changed_at
                FROM salary_history
                WHERE employee_id = :employeeId
                ORDER BY effective_date, id""",
                Map.of("employeeId", employeeId),
                (rs, rowNum) -> new SalaryHistoryEntry(
                        rs.getLong("id"),
                        rs.getBigDecimal("previous_salary"),
                        rs.getBigDecimal("new_salary"),
                        rs.getObject("effective_date", java.time.LocalDate.class),
                        rs.getString("reason"),
                        rs.getString("changed_by"),
                        rs.getTimestamp("changed_at").toInstant()));
    }

    private static String whereClause(EmployeeSearchCriteria criteria, MapSqlParameterSource params) {
        List<String> conditions = new ArrayList<>();
        switch (criteria.status()) {
            case ACTIVE -> conditions.add("e.active");
            case INACTIVE -> conditions.add("NOT e.active");
            case ALL -> { }
        }
        if (criteria.query() != null && !criteria.query().isBlank()) {
            conditions.add("""
                    (e.full_name ILIKE :query ESCAPE '\\' OR e.email ILIKE :query ESCAPE '\\'
                     OR e.employee_code ILIKE :query ESCAPE '\\')""");
            params.addValue("query", "%" + escapeLike(criteria.query().strip()) + "%");
        }
        if (criteria.countryCode() != null) {
            conditions.add("e.country_code = :countryCode");
            params.addValue("countryCode", criteria.countryCode());
        }
        if (criteria.departmentId() != null) {
            conditions.add("e.department_id = :departmentId");
            params.addValue("departmentId", criteria.departmentId());
        }
        if (criteria.jobTitleId() != null) {
            conditions.add("e.job_title_id = :jobTitleId");
            params.addValue("jobTitleId", criteria.jobTitleId());
        }
        return conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);
    }

    /** A search for "50%" means the characters 5, 0, % — not "starts with 50". */
    static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
