package com.acme.salary.employee.application.port.in;

import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.employee.application.model.EmployeeSearchCriteria;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.model.ReferenceData;
import com.acme.salary.employee.application.model.SalaryHistoryEntry;

import java.util.List;

public interface EmployeeQueries {

    PagedResponse<EmployeeView> search(EmployeeSearchCriteria criteria);

    EmployeeView get(long id);

    /** Oldest first, so it reads as a timeline. */
    List<SalaryHistoryEntry> salaryHistory(long employeeId);

    ReferenceData referenceData();
}
