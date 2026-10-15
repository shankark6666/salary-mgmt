package com.acme.salary.seed;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static java.util.Map.entry;

/**
 * The shape of ACME's workforce used to generate realistic seed data: where people work, in which
 * departments and roles, and roughly what each role pays. Ordered collections only, so generation
 * is deterministic for a given random seed.
 */
final class SeedCatalog {

    /** Country code, share of headcount, pay level relative to the US. */
    record CountryProfile(String code, int weight, BigDecimal payFactor) {
    }

    record DepartmentProfile(String name, int weight, List<String> titles) {
    }

    static final List<CountryProfile> COUNTRIES = List.of(
            new CountryProfile("US", 30, new BigDecimal("1.00")),
            new CountryProfile("IN", 25, new BigDecimal("0.22")),
            new CountryProfile("GB", 10, new BigDecimal("0.70")),
            new CountryProfile("DE", 8, new BigDecimal("0.72")),
            new CountryProfile("CA", 7, new BigDecimal("0.78")),
            new CountryProfile("FR", 5, new BigDecimal("0.62")),
            new CountryProfile("AU", 5, new BigDecimal("0.78")),
            new CountryProfile("SG", 5, new BigDecimal("0.72")),
            new CountryProfile("BR", 5, new BigDecimal("0.28")));

    private static final List<String> GENERAL_TITLES = List.of(
            "Associate", "Specialist", "Senior Specialist", "Manager", "Senior Manager", "Director");

    static final List<DepartmentProfile> DEPARTMENTS = List.of(
            new DepartmentProfile("Engineering", 35, List.of("Software Engineer",
                    "Senior Software Engineer", "Staff Engineer", "Principal Engineer", "Manager",
                    "Senior Manager", "Director")),
            new DepartmentProfile("Product", 6, List.of("Product Manager",
                    "Senior Product Manager", "Senior Manager", "Director")),
            new DepartmentProfile("Design", 4, List.of("Designer", "Senior Designer", "Manager")),
            new DepartmentProfile("Data", 5, List.of("Data Analyst", "Data Scientist", "Manager")),
            new DepartmentProfile("Sales", 12, List.of("Associate", "Account Executive",
                    "Sales Manager", "Director")),
            new DepartmentProfile("Marketing", 6, GENERAL_TITLES),
            new DepartmentProfile("Customer Support", 12, List.of("Associate", "Specialist",
                    "Senior Specialist", "Manager")),
            new DepartmentProfile("Finance", 5, GENERAL_TITLES),
            new DepartmentProfile("People", 4, GENERAL_TITLES),
            new DepartmentProfile("Legal", 2, GENERAL_TITLES),
            new DepartmentProfile("Operations", 9, GENERAL_TITLES));

    /** Median annual base salary in the US, in USD. Other countries scale by their pay factor. */
    static final Map<String, BigDecimal> US_MEDIAN_USD = Map.ofEntries(
            entry("Associate", new BigDecimal("55000")),
            entry("Specialist", new BigDecimal("70000")),
            entry("Senior Specialist", new BigDecimal("90000")),
            entry("Software Engineer", new BigDecimal("120000")),
            entry("Senior Software Engineer", new BigDecimal("160000")),
            entry("Staff Engineer", new BigDecimal("200000")),
            entry("Principal Engineer", new BigDecimal("240000")),
            entry("Product Manager", new BigDecimal("140000")),
            entry("Senior Product Manager", new BigDecimal("175000")),
            entry("Designer", new BigDecimal("100000")),
            entry("Senior Designer", new BigDecimal("130000")),
            entry("Data Analyst", new BigDecimal("90000")),
            entry("Data Scientist", new BigDecimal("140000")),
            entry("Account Executive", new BigDecimal("85000")),
            entry("Sales Manager", new BigDecimal("150000")),
            entry("Manager", new BigDecimal("140000")),
            entry("Senior Manager", new BigDecimal("175000")),
            entry("Director", new BigDecimal("220000")));

    /** Organisations are pyramids: within a department, earlier (junior) titles are more common. */
    static int titleWeight(int indexInDepartment, int titleCount) {
        return (titleCount - indexInDepartment) * (titleCount - indexInDepartment);
    }

    private SeedCatalog() {
    }
}
