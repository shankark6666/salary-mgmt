package com.acme.salary.insights;

import com.acme.salary.AuthenticatedAsManager;
import com.acme.salary.TestcontainersConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Insight SQL checked against a small dataset whose answers are worked out by hand below.
 *
 * <pre>
 * US Software Engineer (active):  100k 110k 120k 130k 140k 200k  USD
 *    median (120k+130k)/2 = 125,000   mean 800k/6 = 133,333.33
 *    p25 = 110k + 0.25×10k = 112,500  p75 = 130k + 0.75×10k = 137,500
 * US Software Engineer (INACTIVE): 1,000,000 USD  — must be excluded everywhere
 * IN Software Engineer (active):  2.0M 3.0M INR   median 2.5M = 30,000 USD (rate 0.012)
 * GB Account Executive (active):  50,000 GBP      = 63,500 USD (rate 1.27)
 *
 * Org (9 active), USD sorted: 24k 36k 63.5k 100k 110k 120k 130k 140k 200k
 *    median 110,000   payroll 800,000 + 60,000 + 63,500 = 923,500
 * </pre>
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AuthenticatedAsManager.class})
class InsightsApiIntegrationTest {

    private static final int ENGINEERING = 1;
    private static final int SALES = 5;
    private static final int SOFTWARE_ENGINEER = 4;
    private static final int ACCOUNT_EXECUTIVE = 14;

    @Autowired
    private MockMvc mvc;

    @Autowired
    private JdbcTemplate jdbc;

    private int sequence;

    @BeforeEach
    void seedKnownDataset() {
        jdbc.execute("TRUNCATE salary_history, employees RESTART IDENTITY");
        for (String salary : new String[] {"100000", "110000", "120000", "130000", "140000", "200000"}) {
            insert("US", ENGINEERING, SOFTWARE_ENGINEER, salary, true);
        }
        insert("US", ENGINEERING, SOFTWARE_ENGINEER, "1000000", false);
        insert("IN", ENGINEERING, SOFTWARE_ENGINEER, "2000000", true);
        insert("IN", ENGINEERING, SOFTWARE_ENGINEER, "3000000", true);
        insert("GB", SALES, ACCOUNT_EXECUTIVE, "50000", true);
    }

    @Test
    void overviewTotalsActiveEmployeesInUsd() throws Exception {
        mvc.perform(get("/api/v1/insights/overview"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.headcount").value(9))
                .andExpect(jsonPath("$.data.payrollUsd").value(923500.00))
                .andExpect(jsonPath("$.data.medianUsd").value(110000.00))
                .andExpect(jsonPath("$.data.fxRatesAsOf").value("2026-10-01"))
                .andExpect(jsonPath("$.data.countries[*].countryCode", contains("US", "GB", "IN")));
    }

    @Test
    void countryStatsAreInLocalCurrencyWithUsdCentre() throws Exception {
        mvc.perform(get("/api/v1/insights/overview"))
                .andExpect(jsonPath("$.data.countries[0].headcount").value(6))
                .andExpect(jsonPath("$.data.countries[0].min").value(100000.00))
                .andExpect(jsonPath("$.data.countries[0].median").value(125000.00))
                .andExpect(jsonPath("$.data.countries[0].average").value(133333.33))
                .andExpect(jsonPath("$.data.countries[0].max").value(200000.00))
                .andExpect(jsonPath("$.data.countries[2].currencyCode").value("INR"))
                .andExpect(jsonPath("$.data.countries[2].median").value(2500000.00))
                .andExpect(jsonPath("$.data.countries[2].medianUsd").value(30000.00));
    }

    @Test
    void rolesInCountryReportQuartiles() throws Exception {
        mvc.perform(get("/api/v1/insights/countries/US/roles"))
                .andExpect(jsonPath("$.data.currencyCode").value("USD"))
                .andExpect(jsonPath("$.data.roles[0].jobTitleName").value("Software Engineer"))
                .andExpect(jsonPath("$.data.roles[0].headcount").value(6))
                .andExpect(jsonPath("$.data.roles[0].p25").value(112500.00))
                .andExpect(jsonPath("$.data.roles[0].median").value(125000.00))
                .andExpect(jsonPath("$.data.roles[0].p75").value(137500.00));
    }

    @Test
    void roleComparisonAcrossCountriesIsInUsd() throws Exception {
        mvc.perform(get("/api/v1/insights/roles/{id}/countries", SOFTWARE_ENGINEER))
                .andExpect(jsonPath("$.data.jobTitleName").value("Software Engineer"))
                .andExpect(jsonPath("$.data.countries[*].countryCode", contains("US", "IN")))
                .andExpect(jsonPath("$.data.countries[1].medianLocal").value(2500000.00))
                .andExpect(jsonPath("$.data.countries[1].medianUsd").value(30000.00))
                .andExpect(jsonPath("$.data.countries[1].p25Usd").value(27000.00));
    }

    @Test
    void distributionBucketsUseRoundBounds() throws Exception {
        // 100k..200k into ~10 buckets -> width 10,000 starting at 100,000; 11 buckets.
        mvc.perform(get("/api/v1/insights/countries/US/distribution").param("buckets", "10"))
                .andExpect(jsonPath("$.data.headcount").value(6))
                .andExpect(jsonPath("$.data.bucketWidth").value(10000))
                .andExpect(jsonPath("$.data.buckets[*].count",
                        contains(1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1)));
    }

    @Test
    void outliersAreMeasuredAgainstPeerMedian() throws Exception {
        // Peer median 125k: 200k is +60.0%, 100k is -20.0%, 140k is +12.0%.
        mvc.perform(get("/api/v1/insights/outliers").param("threshold", "15"))
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.content[0].salary").value(200000.00))
                .andExpect(jsonPath("$.data.content[0].deviationPercent").value(60.0))
                .andExpect(jsonPath("$.data.content[0].peerMedian").value(125000.00))
                .andExpect(jsonPath("$.data.content[0].peerCount").value(6))
                .andExpect(jsonPath("$.data.content[1].deviationPercent").value(-20.0));
    }

    @Test
    void smallPeerGroupsAreNeverFlagged() throws Exception {
        // India has 2 engineers, 2.0M vs median 2.5M = -20%, but 2 < minimum group of 5.
        mvc.perform(get("/api/v1/insights/outliers").param("threshold", "5").param("country", "IN"))
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void unknownCountryIs404() throws Exception {
        mvc.perform(get("/api/v1/insights/countries/XX/roles"))
                .andExpect(status().isNotFound());
    }

    private void insert(String country, int departmentId, int jobTitleId, String salary,
                        boolean active) {
        sequence++;
        jdbc.update("""
                INSERT INTO employees (employee_code, full_name, email, country_code, department_id,
                                       job_title_id, employment_type, hire_date, salary, active)
                VALUES (?, ?, ?, ?, ?, ?, 'FULL_TIME', DATE '2024-01-15', ?::numeric, ?)""",
                "T-" + sequence, "Person " + sequence, "p" + sequence + "@acme.com", country,
                departmentId, jobTitleId, salary, active);
    }
}
