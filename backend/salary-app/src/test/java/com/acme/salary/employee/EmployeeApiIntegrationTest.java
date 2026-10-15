package com.acme.salary.employee;

import com.acme.salary.TestcontainersConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The employee API end to end: HTTP → use case → JPA/SQL → Postgres. Covers what unit tests
 * cannot: real SQL, constraints, joins and the USD conversion.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class EmployeeApiIntegrationTest {

    // Reference IDs from V1__reference_data.sql (identity columns start at 1, in insert order).
    private static final int ENGINEERING = 1;
    private static final int SALES = 5;
    private static final int SOFTWARE_ENGINEER = 4;
    private static final int ACCOUNT_EXECUTIVE = 14;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void cleanDatabase() {
        jdbc.execute("TRUNCATE salary_history, employees RESTART IDENTITY");
        jdbc.execute("ALTER SEQUENCE employee_code_seq RESTART WITH 1");
    }

    @Test
    void createdEmployeeHasCodeUsdEquivalentAndStartingSalaryHistory() throws Exception {
        create("Priya Sharma", "priya@acme.com", "IN", "2900000")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.employeeCode").value("EMP-00001"))
                .andExpect(jsonPath("$.data.currencyCode").value("INR"))
                .andExpect(jsonPath("$.data.salary").value(2900000.00))
                .andExpect(jsonPath("$.data.salaryUsd").value(34800.00))
                .andExpect(jsonPath("$.data.departmentName").value("Engineering"));

        mvc.perform(get("/api/v1/employees/1/salary-history"))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].reason").value("Starting salary"))
                .andExpect(jsonPath("$.data[0].previousSalary").doesNotExist());
    }

    @Test
    void salarySortComparesUsdEquivalentsNotRawAmounts() throws Exception {
        create("Usha US", "us@acme.com", "US", "100000");          // 100,000 USD
        create("Indra India", "in@acme.com", "IN", "5000000");     //  60,000 USD
        create("Greta Germany", "de@acme.com", "DE", "80000");     //  86,400 USD

        mvc.perform(get("/api/v1/employees").param("sort", "salaryUsd").param("direction", "DESC"))
                .andExpect(jsonPath("$.data.content[*].fullName",
                        contains("Usha US", "Greta Germany", "Indra India")));
    }

    @Test
    void searchMatchesNameEmailOrCodeCaseInsensitively() throws Exception {
        create("Priya Sharma", "priya@acme.com", "IN", "2900000");
        create("John Smith", "john.smith@acme.com", "US", "120000");

        search("SHARMA").andExpect(jsonPath("$.data.content[*].fullName", contains("Priya Sharma")));
        search("john.smith@").andExpect(jsonPath("$.data.totalElements").value(1));
        search("emp-00002").andExpect(jsonPath("$.data.content[0].fullName").value("John Smith"));
    }

    @Test
    void likeWildcardsInSearchAreTreatedAsLiteralCharacters() throws Exception {
        create("Priya Sharma", "priya@acme.com", "IN", "2900000");

        search("%").andExpect(jsonPath("$.data.totalElements").value(0));
        search("_").andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void filtersByCountryDepartmentAndTitleTogether() throws Exception {
        create("Eng India", "eng.in@acme.com", "IN", "2900000");
        create("Eng US", "eng.us@acme.com", "US", "120000");
        createIn("Sales US", "sales.us@acme.com", "US", "90000", SALES, ACCOUNT_EXECUTIVE);

        mvc.perform(get("/api/v1/employees").param("country", "US")
                        .param("departmentId", String.valueOf(ENGINEERING))
                        .param("jobTitleId", String.valueOf(SOFTWARE_ENGINEER)))
                .andExpect(jsonPath("$.data.content[*].fullName", contains("Eng US")));
    }

    @Test
    void paginationReportsTotals() throws Exception {
        for (int i = 1; i <= 5; i++) {
            create("Person " + i, "p" + i + "@acme.com", "US", "100000");
        }

        mvc.perform(get("/api/v1/employees").param("size", "2").param("page", "2"))
                .andExpect(jsonPath("$.data.content[*].fullName", contains("Person 5")))
                .andExpect(jsonPath("$.data.totalElements").value(5))
                .andExpect(jsonPath("$.data.totalPages").value(3));
    }

    @Test
    void salaryChangeUpdatesSalaryBumpsVersionAndExtendsHistory() throws Exception {
        create("Priya Sharma", "priya@acme.com", "IN", "2900000");

        changeSalary(1, 0, "3200000", "Promotion")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.salary").value(3200000.00))
                .andExpect(jsonPath("$.data.version").value(1));

        mvc.perform(get("/api/v1/employees/1/salary-history"))
                .andExpect(jsonPath("$.data[*].reason", contains("Starting salary", "Promotion")))
                .andExpect(jsonPath("$.data[1].previousSalary").value(2900000.00));
    }

    @Test
    void staleVersionIsRejectedSoNoEditIsSilentlyLost() throws Exception {
        create("Priya Sharma", "priya@acme.com", "IN", "2900000");
        changeSalary(1, 0, "3000000", "Annual review").andExpect(status().isOk());

        // A second HR tab still showing version 0:
        changeSalary(1, 0, "3100000", "Annual review")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.errorCode").value("CONFLICT"));
    }

    @Test
    void emailMustBeUniqueRegardlessOfCase() throws Exception {
        create("Priya Sharma", "priya@acme.com", "IN", "2900000");

        create("Priya Two", "PRIYA@ACME.COM", "IN", "2900000")
                .andExpect(status().isConflict());
    }

    @Test
    void updateCanKeepOwnEmailAndCannotTouchSalary() throws Exception {
        create("Priya Sharma", "priya@acme.com", "IN", "2900000");

        mvc.perform(put("/api/v1/employees/1").contentType(MediaType.APPLICATION_JSON).content("""
                        {"version":0,"fullName":"Priya S. Sharma","email":"priya@acme.com",
                         "departmentId":%d,"jobTitleId":%d,"employmentType":"PART_TIME",
                         "salary":1}""".formatted(ENGINEERING, SOFTWARE_ENGINEER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Priya S. Sharma"))
                .andExpect(jsonPath("$.data.employmentType").value("PART_TIME"))
                .andExpect(jsonPath("$.data.salary").value(2900000.00));
    }

    @Test
    void deactivatedEmployeesLeaveTheDefaultDirectoryAndBecomeReadOnly() throws Exception {
        create("Priya Sharma", "priya@acme.com", "IN", "2900000");

        mvc.perform(post("/api/v1/employees/1/deactivate")).andExpect(status().isOk());

        mvc.perform(get("/api/v1/employees")).andExpect(jsonPath("$.data.totalElements").value(0));
        mvc.perform(get("/api/v1/employees").param("status", "INACTIVE"))
                .andExpect(jsonPath("$.data.totalElements").value(1));
        changeSalary(1, 1, "3000000", "Raise").andExpect(status().isUnprocessableEntity());
    }

    @Test
    void referenceDataListsCountriesWithCurrencies() throws Exception {
        mvc.perform(get("/api/v1/reference-data"))
                .andExpect(jsonPath("$.data.countries", hasSize(9)))
                .andExpect(jsonPath("$.data.countries[?(@.code=='IN')].currencyCode").value("INR"))
                .andExpect(jsonPath("$.data.fxRatesAsOf").value("2026-10-01"));
    }

    private ResultActions create(String name, String email, String country, String salary)
            throws Exception {
        return createIn(name, email, country, salary, ENGINEERING, SOFTWARE_ENGINEER);
    }

    private ResultActions createIn(String name, String email, String country, String salary,
                                   int departmentId, int jobTitleId) throws Exception {
        return mvc.perform(post("/api/v1/employees").contentType(MediaType.APPLICATION_JSON).content("""
                {"fullName":"%s","email":"%s","countryCode":"%s","departmentId":%d,
                 "jobTitleId":%d,"employmentType":"FULL_TIME","hireDate":"2024-03-01",
                 "salary":%s}""".formatted(name, email, country, departmentId, jobTitleId, salary)));
    }

    private ResultActions changeSalary(long id, long version, String salary, String reason)
            throws Exception {
        return mvc.perform(post("/api/v1/employees/{id}/salary-changes", id)
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"version":%d,"newSalary":%s,"effectiveDate":"2026-10-01","reason":"%s"}"""
                        .formatted(version, salary, reason)));
    }

    private ResultActions search(String query) throws Exception {
        return mvc.perform(get("/api/v1/employees").param("q", query));
    }
}
