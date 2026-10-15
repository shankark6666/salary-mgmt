package com.acme.salary.employee.application.model;

import com.acme.salary.employee.domain.EmploymentType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateEmployeeCommand(
        String fullName,
        String email,
        String countryCode,
        int departmentId,
        int jobTitleId,
        EmploymentType employmentType,
        LocalDate hireDate,
        BigDecimal salary) {
}
