package com.acme.salary.employee.domain;

import java.math.BigDecimal;
import java.time.LocalDate;

/** One entry in an employee's salary history. {@code previousSalary} is null for the starting salary. */
public record SalaryChange(BigDecimal previousSalary, BigDecimal newSalary, LocalDate effectiveDate,
                           String reason) {
}
