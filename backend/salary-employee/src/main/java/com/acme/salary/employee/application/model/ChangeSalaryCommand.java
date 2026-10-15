package com.acme.salary.employee.application.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ChangeSalaryCommand(
        long expectedVersion,
        BigDecimal newSalary,
        LocalDate effectiveDate,
        String reason) {
}
