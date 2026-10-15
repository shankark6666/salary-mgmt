package com.acme.salary.employee.application.model;

/**
 * Directory filters. Null filter fields mean "any".
 *
 * @param query matched as a substring of name, email or employee code, case-insensitively
 */
public record EmployeeSearchCriteria(
        String query,
        String countryCode,
        Integer departmentId,
        Integer jobTitleId,
        EmployeeStatus status,
        int page,
        int size,
        EmployeeSortField sort,
        SortDirection direction) {
}
