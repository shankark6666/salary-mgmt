package com.acme.salary.seed;

import com.acme.salary.TestcontainersConfiguration;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/** Generation rules are covered by EmployeeSeedGeneratorTest; this checks what reaches Postgres. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class EmployeeSeederTest {

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private TransactionTemplate transaction;

    @AfterEach
    void cleanUp() {
        jdbc.execute("TRUNCATE salary_history, employees RESTART IDENTITY");
    }

    @Test
    void insertsEmployeesWithTheirFullSalaryHistory() {
        int inserted = seeder(500).seed();

        assertThat(inserted).isEqualTo(500);
        assertThat(count("SELECT count(*) FROM employees")).isEqualTo(500);
        assertThat(count("SELECT count(DISTINCT employee_id) FROM salary_history")).isEqualTo(500);
    }

    @Test
    void currentSalaryMatchesLatestHistoryEntryForEveryEmployee() {
        seeder(500).seed();

        int mismatches = count("""
                SELECT count(*) FROM employees e
                JOIN LATERAL (
                    SELECT new_salary FROM salary_history h
                    WHERE h.employee_id = e.id
                    ORDER BY effective_date DESC, id DESC LIMIT 1
                ) latest ON true
                WHERE latest.new_salary <> e.salary""");

        assertThat(mismatches).isZero();
    }

    @Test
    void secondRunDoesNothingWhenDataExists() {
        seeder(200).seed();

        int insertedAgain = seeder(200).seed();

        assertThat(insertedAgain).isZero();
        assertThat(count("SELECT count(*) FROM employees")).isEqualTo(200);
    }

    private EmployeeSeeder seeder(int employeeCount) {
        return new EmployeeSeeder(jdbc, transaction,
                new SeedProperties(true, employeeCount, 42L, LocalDate.of(2026, 10, 1)));
    }

    private int count(String sql) {
        return jdbc.queryForObject(sql, Integer.class);
    }
}
