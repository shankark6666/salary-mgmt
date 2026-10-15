package com.acme.salary.employee.adapter.in.web.dto;

import com.acme.salary.employee.application.model.ChangeSalaryCommand;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ChangeSalaryRequest(
        @NotNull Long version,
        @NotNull @Positive @Digits(integer = 12, fraction = 2) BigDecimal newSalary,
        @NotNull LocalDate effectiveDate,
        @NotBlank @Size(max = 500) String reason) {

    public ChangeSalaryCommand toCommand() {
        return new ChangeSalaryCommand(version, newSalary, effectiveDate, reason);
    }
}
