package com.acme.salary.employee;

import com.acme.salary.AuthenticatedAsManager;
import com.acme.salary.TestcontainersConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AuthenticatedAsManager.class})
class EmployeeExportIntegrationTest {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void seed() {
        jdbc.execute("TRUNCATE salary_history, employees, audit_events RESTART IDENTITY");
        insert("EMP-1", "Usha Iyer", "usha@acme.com", "US", "120000.00", true);
        insert("EMP-2", "=HYPERLINK(\"http://evil.example\")", "evil@acme.com", "US", "90000.00", true);
        insert("EMP-3", "Gone Person", "gone@acme.com", "US", "80000.00", false);
        insert("EMP-4", "Priya Müller", "priya@acme.com", "IN", "2900000.00", true);
    }

    @Test
    void exportsTheFilteredDirectoryAsExcelFriendlyCsv() throws Exception {
        MvcResult result = mvc.perform(get("/api/v1/employees/export").param("country", "US").param("sort", "salaryUsd").param("direction", "DESC"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/csv;charset=UTF-8"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.matchesPattern("attachment; filename=\"employees-\\d{4}-\\d{2}-\\d{2}\\.csv\"")))
                .andReturn();

        List<String> lines = result.getResponse().getContentAsString(StandardCharsets.UTF_8).lines().toList();
        assertThat(lines.get(0)).startsWith("﻿Employee code,Full name,Email,Country");
        assertThat(lines).hasSize(3); // header + the two ACTIVE US employees, highest salary first
        assertThat(lines.get(1)).startsWith("EMP-1,Usha Iyer,usha@acme.com,United States,USD")
                .contains(",120000.00,120000.00,Active");
    }

    @Test
    void neutralisesSpreadsheetFormulasInNames() throws Exception {
        String csv = mvc.perform(get("/api/v1/employees/export").param("country", "US"))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertThat(csv).contains("\"'=HYPERLINK(\"\"http://evil.example\"\")\"");
        assertThat(csv).doesNotContain(",=HYPERLINK");
    }

    @Test
    void keepsNonAsciiNamesIntact() throws Exception {
        String csv = mvc.perform(get("/api/v1/employees/export").param("country", "IN"))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertThat(csv).contains("Priya Müller").contains("India,INR");
    }

    @Test
    void everyExportIsAuditedWithWhoAndWhat() throws Exception {
        mvc.perform(get("/api/v1/employees/export").param("country", "US")).andExpect(status().isOk());

        List<Map<String, Object>> events = jdbc.queryForList("SELECT actor, action, details FROM audit_events");
        assertThat(events).hasSize(1);
        assertThat(events.get(0))
                .containsEntry("actor", AuthenticatedAsManager.USERNAME)
                .containsEntry("action", "EMPLOYEE_EXPORT");
        assertThat((String) events.get(0).get("details")).contains("rows=2").contains("country=US");
    }

    @Test
    void emptySelectionStillYieldsAHeaderRow() throws Exception {
        String csv = mvc.perform(get("/api/v1/employees/export").param("q", "nobody-matches-this"))
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        assertThat(csv.lines().toList()).hasSize(1);
    }

    private void insert(String code, String name, String email, String country, String salary, boolean active) {
        jdbc.update("""
                INSERT INTO employees (employee_code, full_name, email, country_code, department_id, job_title_id,
                                       employment_type, hire_date, salary, active)
                VALUES (?, ?, ?, ?, 1, 4, 'FULL_TIME', DATE '2024-03-01', ?::numeric, ?)""",
                code, name, email, country, salary, active);
    }
}
