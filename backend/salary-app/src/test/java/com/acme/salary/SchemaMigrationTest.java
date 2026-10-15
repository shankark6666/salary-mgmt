package com.acme.salary;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Guards the rules the database enforces on its own, so they hold even for writes that bypass
 * the application (seed scripts, manual fixes). Each test rolls back.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@Transactional
class SchemaMigrationTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void everyCountryHasAnFxRateForItsCurrency() {
        Integer countriesWithoutRate = jdbc.queryForObject("""
                SELECT count(*) FROM countries c
                LEFT JOIN fx_rates r ON r.currency_code = c.currency_code
                WHERE r.currency_code IS NULL""", Integer.class);

        assertThat(countriesWithoutRate).isZero();
        assertThat(count("countries")).isEqualTo(9);
    }

    @Test
    void referenceDataIsSeeded() {
        assertThat(count("departments")).isEqualTo(11);
        assertThat(count("job_titles")).isEqualTo(18);
    }

    @Test
    void salaryMustBePositive() {
        assertThatThrownBy(() -> insertEmployee("E-1", "a@acme.com", "0.00"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void emailIsUniqueIgnoringCase() {
        insertEmployee("E-1", "Jane.Doe@acme.com", "50000.00");

        assertThatThrownBy(() -> insertEmployee("E-2", "jane.doe@ACME.com", "50000.00"))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void salaryKeepsExactDecimalValue() {
        insertEmployee("E-1", "a@acme.com", "123456789012.34");

        String stored = jdbc.queryForObject(
                "SELECT salary::text FROM employees WHERE employee_code = 'E-1'", String.class);

        assertThat(stored).isEqualTo("123456789012.34");
    }

    private int count(String table) {
        return jdbc.queryForObject("SELECT count(*) FROM " + table, Integer.class);
    }

    private void insertEmployee(String code, String email, String salary) {
        jdbc.update("""
                INSERT INTO employees (employee_code, full_name, email, country_code, department_id,
                                       job_title_id, employment_type, hire_date, salary)
                VALUES (?, 'Test Person', ?, 'US', 1, 1, 'FULL_TIME', DATE '2024-01-15', ?::numeric)""",
                code, email, salary);
    }
}
