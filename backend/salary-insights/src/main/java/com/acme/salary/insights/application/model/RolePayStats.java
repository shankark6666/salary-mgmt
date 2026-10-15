package com.acme.salary.insights.application.model;

import java.math.BigDecimal;

/** Pay for one job title within one country, in that country's currency. */
public record RolePayStats(
        int jobTitleId,
        String jobTitleName,
        int level,
        long headcount,
        BigDecimal min,
        BigDecimal p25,
        BigDecimal median,
        BigDecimal p75,
        BigDecimal max) {
}
