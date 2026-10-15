package com.acme.salary.employee.adapter.in.web.dto;

import com.acme.salary.employee.application.model.UpdateEmployeeCommand;
import com.acme.salary.employee.domain.EmploymentType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** No salary, country or hire date: see {@link UpdateEmployeeCommand}. */
public record UpdateEmployeeRequest(
        @NotNull Long version,
        @NotBlank @Size(max = 200) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotNull @Positive Integer departmentId,
        @NotNull @Positive Integer jobTitleId,
        @NotNull EmploymentType employmentType) {

    public UpdateEmployeeCommand toCommand() {
        return new UpdateEmployeeCommand(version, fullName, email, departmentId, jobTitleId,
                employmentType);
    }
}
