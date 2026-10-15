package com.acme.salary.seed;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.sql.Date;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Writes the generated workforce to the database on startup when {@code app.seed.enabled=true}.
 *
 * <p>Idempotent: does nothing if any employee exists, so it is safe to leave enabled across
 * restarts. Everything is inserted in one transaction with JDBC batches — either the full dataset
 * lands or none of it does.
 */
@Slf4j
@Component
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(SeedProperties.class)
public class EmployeeSeeder implements ApplicationRunner {

    private static final int BATCH_SIZE = 1_000;

    private final JdbcTemplate jdbc;
    private final TransactionTemplate transaction;
    private final SeedProperties properties;

    public EmployeeSeeder(JdbcTemplate jdbc, TransactionTemplate transaction,
                          SeedProperties properties) {
        this.jdbc = jdbc;
        this.transaction = transaction;
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed();
    }

    /** @return number of employees inserted; 0 if data already existed */
    public int seed() {
        Integer existing = jdbc.queryForObject("SELECT count(*) FROM employees", Integer.class);
        if (existing != null && existing > 0) {
            log.info("Seed skipped: {} employees already present", existing);
            return 0;
        }

        long started = System.nanoTime();
        List<SeedEmployee> employees = new EmployeeSeedGenerator(loadUsdRates(), properties.asOf())
                .generate(properties.employeeCount(), properties.randomSeed());
        transaction.executeWithoutResult(status -> insert(employees));

        log.info("Seeded {} employees in {} ms", employees.size(),
                (System.nanoTime() - started) / 1_000_000);
        return employees.size();
    }

    private void insert(List<SeedEmployee> employees) {
        Map<String, Integer> departmentIds = idsByName("departments");
        Map<String, Integer> titleIds = idsByName("job_titles");

        jdbc.batchUpdate("""
                INSERT INTO employees (employee_code, full_name, email, country_code, department_id,
                                       job_title_id, employment_type, hire_date, salary, active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                employees, BATCH_SIZE, (ps, e) -> {
                    ps.setString(1, e.employeeCode());
                    ps.setString(2, e.fullName());
                    ps.setString(3, e.email());
                    ps.setString(4, e.countryCode());
                    ps.setInt(5, departmentIds.get(e.department()));
                    ps.setInt(6, titleIds.get(e.jobTitle()));
                    ps.setString(7, e.employmentType());
                    ps.setDate(8, Date.valueOf(e.hireDate()));
                    ps.setBigDecimal(9, e.salary());
                    ps.setBoolean(10, e.active());
                });

        Map<String, Long> employeeIds = new HashMap<>();
        jdbc.query("SELECT id, employee_code FROM employees",
                rs -> { employeeIds.put(rs.getString("employee_code"), rs.getLong("id")); });

        record HistoryRow(long employeeId, SeedEmployee.SalaryChange change) {
        }
        List<HistoryRow> rows = new ArrayList<>();
        for (SeedEmployee e : employees) {
            long id = employeeIds.get(e.employeeCode());
            e.history().forEach(change -> rows.add(new HistoryRow(id, change)));
        }

        jdbc.batchUpdate("""
                INSERT INTO salary_history (employee_id, previous_salary, new_salary,
                                            effective_date, reason)
                VALUES (?, ?, ?, ?, ?)""",
                rows, BATCH_SIZE, (ps, row) -> {
                    ps.setLong(1, row.employeeId());
                    ps.setBigDecimal(2, row.change().previousSalary());
                    ps.setBigDecimal(3, row.change().newSalary());
                    ps.setDate(4, Date.valueOf(row.change().effectiveDate()));
                    ps.setString(5, row.change().reason());
                });

        // New hires created through the app continue after the seeded codes.
        jdbc.queryForObject("""
                SELECT setval('employee_code_seq',
                              (SELECT max(substring(employee_code FROM 5)::int) FROM employees))""",
                Long.class);
    }

    private Map<String, BigDecimal> loadUsdRates() {
        Map<String, BigDecimal> rates = new HashMap<>();
        jdbc.query("""
                SELECT c.code, r.usd_rate
                FROM countries c JOIN fx_rates r ON r.currency_code = c.currency_code""",
                rs -> { rates.put(rs.getString("code"), rs.getBigDecimal("usd_rate")); });
        return rates;
    }

    private Map<String, Integer> idsByName(String table) {
        Map<String, Integer> ids = new HashMap<>();
        jdbc.query("SELECT id, name FROM " + table,
                rs -> { ids.put(rs.getString("name"), rs.getInt("id")); });
        return ids;
    }
}
