package com.acme.salary.insights.application.model;

import java.math.BigDecimal;

/** Pay in one country, in local currency, with USD equivalents of the centre for comparison. */
public record CountryPayStats(
        String countryCode,
        String countryName,
        String currencyCode,
        long headcount,
        BigDecimal min,
        BigDecimal median,
        BigDecimal average,
        BigDecimal max,
        BigDecimal medianUsd,
        BigDecimal averageUsd,
        BigDecimal payrollUsd) {
}
