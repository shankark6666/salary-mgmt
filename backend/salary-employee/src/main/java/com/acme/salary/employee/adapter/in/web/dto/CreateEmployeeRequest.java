package com.acme.salary.employee.adapter.in.web.dto;

import com.acme.salary.employee.application.model.CreateEmployeeCommand;
import com.acme.salary.employee.domain.EmploymentType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Shape checks only; business rules (e.g. hire date not in the future) live in the domain. */
public record CreateEmployeeRequest(
        @NotBlank @Size(max = 200) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Pattern(regexp = "[A-Z]{2}", message = "must be a 2-letter country code")
        String countryCode,
        @NotNull @Positive Integer departmentId,
        @NotNull @Positive Integer jobTitleId,
        @NotNull EmploymentType employmentType,
        @NotNull LocalDate hireDate,
        @NotNull @Positive @Digits(integer = 12, fraction = 2) BigDecimal salary) {

    public CreateEmployeeCommand toCommand() {
        return new CreateEmployeeCommand(fullName, email, countryCode, departmentId, jobTitleId,
                employmentType, hireDate, salary);
    }
}
