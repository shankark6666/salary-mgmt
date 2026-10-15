package com.acme.salary.insights.application.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** One job title compared across countries. Spread is in USD so the rows are comparable. */
public record RoleCountryComparison(int jobTitleId, String jobTitleName, LocalDate fxRatesAsOf,
                                    List<Row> countries) {

    public record Row(
            String countryCode,
            String countryName,
            String currencyCode,
            long headcount,
            BigDecimal medianLocal,
            BigDecimal p25Usd,
            BigDecimal medianUsd,
            BigDecimal p75Usd) {
    }
}
