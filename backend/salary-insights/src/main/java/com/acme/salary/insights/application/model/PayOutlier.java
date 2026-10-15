package com.acme.salary.insights.application.model;

import java.math.BigDecimal;

/**
 * Someone paid far from the median of their peers (same country and job title).
 *
 * @param deviationPercent positive above the median, negative below
 */
public record PayOutlier(
        long employeeId,
        String employeeCode,
        String fullName,
        String countryCode,
        String currencyCode,
        int jobTitleId,
        String jobTitleName,
        BigDecimal salary,
        BigDecimal peerMedian,
        BigDecimal deviationPercent,
        long peerCount) {
}
