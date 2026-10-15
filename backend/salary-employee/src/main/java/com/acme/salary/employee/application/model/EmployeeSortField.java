package com.acme.salary.employee.application.model;

import com.acme.salary.common.exception.BadRequestException;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Columns the directory can be sorted by. A closed list: user input never reaches ORDER BY.
 *
 * <p>Salary sorts by its USD equivalent, because sorting raw amounts across currencies would rank
 * every rupee salary above every dollar one.
 */
public enum EmployeeSortField {
    NAME("name"),
    EMPLOYEE_CODE("employeeCode"),
    EMAIL("email"),
    COUNTRY("country"),
    DEPARTMENT("department"),
    JOB_TITLE("jobTitle"),
    HIRE_DATE("hireDate"),
    SALARY_USD("salaryUsd");

    private final String apiName;

    EmployeeSortField(String apiName) {
        this.apiName = apiName;
    }

    public String apiName() {
        return apiName;
    }

    public static EmployeeSortField fromApiName(String value) {
        return Arrays.stream(values())
                .filter(field -> field.apiName.equals(value))
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Cannot sort by '%s'. Allowed: %s"
                        .formatted(value, Arrays.stream(values())
                                .map(EmployeeSortField::apiName)
                                .collect(Collectors.joining(", ")))));
    }
}
