package com.acme.salary.seed;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** One generated employee, with the salary history that leads to {@code salary}. */
record SeedEmployee(
        String employeeCode,
        String fullName,
        String email,
        String countryCode,
        String department,
        String jobTitle,
        String employmentType,
        LocalDate hireDate,
        BigDecimal salary,
        boolean active,
        List<SalaryChange> history) {

    /** {@code previousSalary} is null for the starting salary. */
    record SalaryChange(BigDecimal previousSalary, BigDecimal newSalary, LocalDate effectiveDate,
                        String reason) {
    }
}
