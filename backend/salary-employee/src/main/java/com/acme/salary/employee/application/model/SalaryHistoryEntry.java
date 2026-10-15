package com.acme.salary.employee.application.model;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SalaryHistoryEntry(
        long id,
        BigDecimal previousSalary,
        BigDecimal newSalary,
        LocalDate effectiveDate,
        String reason,
        Instant recordedAt) {
}
