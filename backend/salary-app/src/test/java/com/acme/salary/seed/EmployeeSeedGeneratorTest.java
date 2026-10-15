package com.acme.salary.seed;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class EmployeeSeedGeneratorTest {

    private static final LocalDate AS_OF = LocalDate.of(2026, 10, 1);

    /** Mirrors V1__reference_data.sql. */
    private static final Map<String, BigDecimal> USD_RATE_BY_COUNTRY = Map.of(
            "US", new BigDecimal("1.00"), "GB", new BigDecimal("1.27"),
            "DE", new BigDecimal("1.08"), "FR", new BigDecimal("1.08"),
            "IN", new BigDecimal("0.012"), "CA", new BigDecimal("0.73"),
            "AU", new BigDecimal("0.66"), "SG", new BigDecimal("0.74"),
            "BR", new BigDecimal("0.18"));

    private static final EmployeeSeedGenerator GENERATOR =
            new EmployeeSeedGenerator(USD_RATE_BY_COUNTRY, AS_OF);

    private static List<SeedEmployee> employees;

    @BeforeAll
    static void generateOnce() {
        employees = GENERATOR.generate(10_000, 42L);
    }

    @Test
    void generatesRequestedCount() {
        assertThat(employees).hasSize(10_000);
    }

    @Test
    void sameSeedProducesIdenticalData() {
        assertThat(GENERATOR.generate(200, 7L)).isEqualTo(GENERATOR.generate(200, 7L));
    }

    @Test
    void differentSeedsProduceDifferentData() {
        assertThat(GENERATOR.generate(200, 7L)).isNotEqualTo(GENERATOR.generate(200, 8L));
    }

    @Test
    void employeeCodesAndEmailsAreUnique() {
        assertThat(employees).extracting(SeedEmployee::employeeCode).doesNotHaveDuplicates();
        assertThat(employees).extracting(e -> e.email().toLowerCase()).doesNotHaveDuplicates();
    }

    @Test
    void emailsAreAsciiCompanyAddresses() {
        assertThat(employees).allSatisfy(e ->
                assertThat(e.email()).matches("[a-z]+\\.[a-z]+\\d*@acme\\.com"));
    }

    @Test
    void salariesArePositiveWholeHundredsWithTwoDecimals() {
        assertThat(employees).allSatisfy(e -> {
            assertThat(e.salary()).isPositive();
            assertThat(e.salary().scale()).isEqualTo(2);
            assertThat(e.salary().remainder(new BigDecimal("100"))).isZero();
        });
    }

    @Test
    void everyTitleBelongsToItsDepartment() {
        Map<String, List<String>> titlesByDepartment = SeedCatalog.DEPARTMENTS.stream()
                .collect(Collectors.toMap(SeedCatalog.DepartmentProfile::name,
                        SeedCatalog.DepartmentProfile::titles));

        assertThat(employees).allSatisfy(e ->
                assertThat(titlesByDepartment.get(e.department())).contains(e.jobTitle()));
    }

    @Test
    void countryMixFollowsCatalogWeights() {
        Map<String, Long> headcount = employees.stream()
                .collect(Collectors.groupingBy(SeedEmployee::countryCode, Collectors.counting()));

        assertThat(share(headcount, "US")).isCloseTo(0.30, within(0.02));
        assertThat(share(headcount, "IN")).isCloseTo(0.25, within(0.02));
        assertThat(share(headcount, "BR")).isCloseTo(0.05, within(0.01));
    }

    @Test
    void medianPayTracksTheCatalogInUsd() {
        // Senior Software Engineer: US median 160k USD; India factor 0.22 -> 35.2k USD.
        assertThat(medianUsd("US", "Senior Software Engineer")).isBetween(150_000.0, 170_000.0);
        assertThat(medianUsd("IN", "Senior Software Engineer")).isBetween(32_000.0, 38_500.0);
    }

    @Test
    void historyStartsWithStartingSalaryAndEndsAtCurrentSalary() {
        assertThat(employees).allSatisfy(e -> {
            List<SeedEmployee.SalaryChange> history = e.history();
            SeedEmployee.SalaryChange first = history.get(0);
            SeedEmployee.SalaryChange last = history.get(history.size() - 1);

            assertThat(first.previousSalary()).isNull();
            assertThat(first.effectiveDate()).isEqualTo(e.hireDate());
            assertThat(last.newSalary()).isEqualByComparingTo(e.salary());
        });
    }

    @Test
    void historyIsChronologicalAndEachChangeContinuesFromThePreviousOne() {
        assertThat(employees).allSatisfy(e -> {
            List<SeedEmployee.SalaryChange> history = e.history();
            assertThat(history).isSortedAccordingTo(
                    Comparator.comparing(SeedEmployee.SalaryChange::effectiveDate));
            for (int i = 1; i < history.size(); i++) {
                assertThat(history.get(i).previousSalary())
                        .isEqualByComparingTo(history.get(i - 1).newSalary());
                assertThat(history.get(i).newSalary())
                        .isGreaterThan(history.get(i).previousSalary());
            }
        });
    }

    @Test
    void raisesLandOnHireAnniversariesLikeAnnualReviews() {
        assertThat(employees).allSatisfy(e -> e.history().stream().skip(1).forEach(change -> {
            assertThat(change.effectiveDate().getMonth()).isEqualTo(e.hireDate().getMonth());
            assertThat(change.effectiveDate().getYear()).isGreaterThan(e.hireDate().getYear());
        }));
    }

    @Test
    void mostReviewYearsIncludeARaise() {
        double raisesPerTenureYear = employees.stream().mapToInt(e -> e.history().size() - 1).sum()
                / (double) employees.stream()
                        .mapToLong(e -> java.time.temporal.ChronoUnit.YEARS.between(e.hireDate(), AS_OF))
                        .sum();

        assertThat(raisesPerTenureYear).isCloseTo(0.85, within(0.02));
    }

    @Test
    void datesFallBetweenCompanyFoundingAndAsOfDate() {
        assertThat(employees).allSatisfy(e -> {
            assertThat(e.hireDate()).isAfterOrEqualTo(EmployeeSeedGenerator.EARLIEST_HIRE_DATE);
            assertThat(e.history()).allSatisfy(change ->
                    assertThat(change.effectiveDate()).isBeforeOrEqualTo(AS_OF));
        });
    }

    @Test
    void someEmployeesAreInactiveButMostAreActive() {
        long inactive = employees.stream().filter(e -> !e.active()).count();

        assertThat(inactive).isBetween(150L, 450L);
    }

    private static double share(Map<String, Long> headcount, String country) {
        return headcount.get(country) / (double) employees.size();
    }

    private static double medianUsd(String country, String title) {
        Function<SeedEmployee, BigDecimal> toUsd = e -> e.salary()
                .multiply(USD_RATE_BY_COUNTRY.get(country)).setScale(0, RoundingMode.HALF_UP);
        List<BigDecimal> sorted = employees.stream()
                .filter(e -> e.countryCode().equals(country) && e.jobTitle().equals(title))
                .map(toUsd)
                .sorted()
                .toList();
        assertThat(sorted).as("sample for %s / %s", country, title).hasSizeGreaterThan(20);
        return sorted.get(sorted.size() / 2).doubleValue();
    }
}
