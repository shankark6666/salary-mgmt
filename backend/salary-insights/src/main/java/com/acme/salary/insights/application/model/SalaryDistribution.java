package com.acme.salary.insights.application.model;

import java.math.BigDecimal;
import java.util.List;

/** Histogram of salaries in one country. Buckets are [lower, upper). */
public record SalaryDistribution(String countryCode, String currencyCode, long headcount,
                                 BigDecimal bucketWidth, List<Bucket> buckets) {

    public record Bucket(BigDecimal lower, BigDecimal upper, long count) {
    }
}
