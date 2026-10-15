package com.acme.salary.employee.application.model;

import com.acme.salary.employee.domain.EmploymentType;

/**
 * Editable details only. Salary changes go through {@link ChangeSalaryCommand} so they are
 * recorded in history; country and hire date are fixed after hiring.
 *
 * @param expectedVersion the version the user was looking at; a mismatch means someone else
 *                        changed the record in the meantime
 */
public record UpdateEmployeeCommand(
        long expectedVersion,
        String fullName,
        String email,
        int departmentId,
        int jobTitleId,
        EmploymentType employmentType) {
}
