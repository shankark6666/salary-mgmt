package com.acme.salary.insights.application.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Active employees only. USD figures use the reference rates as of {@code fxRatesAsOf}. */
public record OrgOverview(
        long headcount,
        BigDecimal payrollUsd,
        BigDecimal medianUsd,
        LocalDate fxRatesAsOf,
        List<CountryPayStats> countries) {
}
