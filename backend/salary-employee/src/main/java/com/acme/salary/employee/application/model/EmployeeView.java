package com.acme.salary.employee.application.model;

import com.acme.salary.employee.domain.EmploymentType;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * An employee as the HR Manager sees them: reference names resolved, salary in local currency
 * with a USD equivalent for comparison (ADR-0003).
 */
public record EmployeeView(
        long id,
        String employeeCode,
        String fullName,
        String email,
        String countryCode,
        String countryName,
        String currencyCode,
        int departmentId,
        String departmentName,
        int jobTitleId,
        String jobTitleName,
        EmploymentType employmentType,
        LocalDate hireDate,
        BigDecimal salary,
        BigDecimal salaryUsd,
        boolean active,
        long version) {
}
