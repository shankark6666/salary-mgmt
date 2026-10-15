package com.acme.salary.seed;

import com.acme.salary.seed.SeedCatalog.CountryProfile;
import com.acme.salary.seed.SeedCatalog.DepartmentProfile;
import com.acme.salary.seed.SeedEmployee.SalaryChange;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.function.ToIntFunction;

/**
 * Generates a realistic, fully deterministic workforce: the same seed always yields the same
 * employees. Pure Java with no I/O, so it is unit-tested without Spring or a database.
 *
 * <p>Salary model: role median in the US (USD) × country pay factor, converted to local currency,
 * spread log-normally (σ = 0.12). About 1.5% of people are deliberately paid far from their peers
 * so the outlier report has something real to find. Each salary is a full-time-equivalent annual
 * base, so part-time staff compare fairly with their peers.
 */
class EmployeeSeedGenerator {

    static final LocalDate EARLIEST_HIRE_DATE = LocalDate.of(2012, 1, 1);

    private static final double SALARY_SPREAD_SIGMA = 0.12;
    private static final double OUTLIER_RATE = 0.015;
    private static final double INACTIVE_RATE = 0.03;
    private static final double RAISE_SKIP_RATE = 0.15;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    private final Map<String, BigDecimal> usdRateByCountry;
    private final LocalDate asOf;

    /**
     * @param usdRateByCountry USD value of one unit of each country's currency
     * @param asOf             "today" for the generated data; fixed so output never depends on the clock
     */
    EmployeeSeedGenerator(Map<String, BigDecimal> usdRateByCountry, LocalDate asOf) {
        this.usdRateByCountry = Map.copyOf(usdRateByCountry);
        this.asOf = asOf;
    }

    List<SeedEmployee> generate(int count, long seed) {
        Random random = new Random(seed);
        Map<String, Integer> emailCounts = new HashMap<>();
        List<SeedEmployee> employees = new ArrayList<>(count);
        for (int i = 1; i <= count; i++) {
            employees.add(generateOne(i, random, emailCounts));
        }
        return employees;
    }

    private SeedEmployee generateOne(int sequence, Random random, Map<String, Integer> emailCounts) {
        CountryProfile country = pick(SeedCatalog.COUNTRIES, CountryProfile::weight, random);
        DepartmentProfile department = pick(SeedCatalog.DEPARTMENTS, DepartmentProfile::weight, random);
        String title = pickTitle(department, random);

        NamePools.Pool names = NamePools.forCountry(country.code());
        String first = names.first().get(random.nextInt(names.first().size()));
        String last = names.last().get(random.nextInt(names.last().size()));

        LocalDate hireDate = randomHireDate(random);
        BigDecimal salary = currentSalary(country, title, random);

        return new SeedEmployee(
                "EMP-%05d".formatted(sequence),
                first + " " + last,
                uniqueEmail(first, last, emailCounts),
                country.code(),
                department.name(),
                title,
                employmentType(random),
                hireDate,
                salary,
                random.nextDouble() >= INACTIVE_RATE,
                salaryHistory(hireDate, salary, random));
    }

    private BigDecimal currentSalary(CountryProfile country, String title, Random random) {
        BigDecimal medianUsd = SeedCatalog.US_MEDIAN_USD.get(title).multiply(country.payFactor());
        BigDecimal medianLocal = medianUsd.divide(usdRateByCountry.get(country.code()),
                MathContext.DECIMAL64);

        double spread = Math.exp(random.nextGaussian() * SALARY_SPREAD_SIGMA);
        if (random.nextDouble() < OUTLIER_RATE) {
            spread *= random.nextBoolean() ? 1.45 : 0.65;
        }
        return roundToHundred(medianLocal.multiply(BigDecimal.valueOf(spread)));
    }

    /**
     * Builds history backwards from the current salary so the last entry always equals it.
     * Every hire anniversary is a review; some years pass without a raise.
     */
    private List<SalaryChange> salaryHistory(LocalDate hireDate, BigDecimal currentSalary,
                                             Random random) {
        int fullYears = (int) ChronoUnit.YEARS.between(hireDate, asOf);

        List<SalaryChange> newestFirst = new ArrayList<>();
        BigDecimal after = currentSalary;
        for (int year = fullYears; year >= 1; year--) {
            if (random.nextDouble() < RAISE_SKIP_RATE) {
                continue;
            }
            LocalDate effective = hireDate.plusYears(year);
            RaiseKind kind = RaiseKind.pick(random);
            BigDecimal before = roundToHundred(after.divide(
                    BigDecimal.ONE.add(kind.randomPercent(random)), MathContext.DECIMAL64));
            if (before.compareTo(after) >= 0) {
                before = after.subtract(HUNDRED);
            }
            newestFirst.add(new SalaryChange(before, after, effective, kind.reason));
            after = before;
        }
        newestFirst.add(new SalaryChange(null, after, hireDate, "Starting salary"));

        Collections.reverse(newestFirst);
        return List.copyOf(newestFirst);
    }

    private LocalDate randomHireDate(Random random) {
        long days = ChronoUnit.DAYS.between(EARLIEST_HIRE_DATE, asOf.minusDays(30));
        return EARLIEST_HIRE_DATE.plusDays((long) (random.nextDouble() * days));
    }

    private static String pickTitle(DepartmentProfile department, Random random) {
        List<String> titles = department.titles();
        int totalWeight = 0;
        for (int i = 0; i < titles.size(); i++) {
            totalWeight += SeedCatalog.titleWeight(i, titles.size());
        }
        int roll = random.nextInt(totalWeight);
        for (int i = 0; i < titles.size(); i++) {
            roll -= SeedCatalog.titleWeight(i, titles.size());
            if (roll < 0) {
                return titles.get(i);
            }
        }
        throw new IllegalStateException("unreachable");
    }

    private static String employmentType(Random random) {
        double roll = random.nextDouble();
        if (roll < 0.90) {
            return "FULL_TIME";
        }
        return roll < 0.95 ? "PART_TIME" : "CONTRACTOR";
    }

    private static String uniqueEmail(String first, String last, Map<String, Integer> emailCounts) {
        String local = ascii(first) + "." + ascii(last);
        int n = emailCounts.merge(local, 1, Integer::sum);
        return (n == 1 ? local : local + n) + "@acme.com";
    }

    /** "Müller" -> "muller", "Léa" -> "lea". */
    private static String ascii(String name) {
        return Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z]", "");
    }

    private static BigDecimal roundToHundred(BigDecimal value) {
        return value.divide(HUNDRED, 0, RoundingMode.HALF_UP).multiply(HUNDRED).setScale(2);
    }

    private static <T> T pick(List<T> options, ToIntFunction<T> weight, Random random) {
        int total = options.stream().mapToInt(weight).sum();
        int roll = random.nextInt(total);
        for (T option : options) {
            roll -= weight.applyAsInt(option);
            if (roll < 0) {
                return option;
            }
        }
        throw new IllegalStateException("unreachable");
    }

    private enum RaiseKind {
        ANNUAL_REVIEW("Annual review", 0.03, 0.08, 70),
        MARKET_ADJUSTMENT("Market adjustment", 0.05, 0.10, 15),
        PROMOTION("Promotion", 0.12, 0.18, 15);

        private final String reason;
        private final double minPercent;
        private final double maxPercent;
        private final int weight;

        RaiseKind(String reason, double minPercent, double maxPercent, int weight) {
            this.reason = reason;
            this.minPercent = minPercent;
            this.maxPercent = maxPercent;
            this.weight = weight;
        }

        static RaiseKind pick(Random random) {
            return EmployeeSeedGenerator.pick(List.of(values()), kind -> kind.weight, random);
        }

        BigDecimal randomPercent(Random random) {
            return BigDecimal.valueOf(minPercent + random.nextDouble() * (maxPercent - minPercent));
        }
    }
}
