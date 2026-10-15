package com.acme.salary.employee.application.port.out;

import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.employee.application.model.EmployeeSearchCriteria;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.model.SalaryHistoryEntry;

import java.util.List;
import java.util.Optional;

/** Read side, shaped for screens rather than for the domain (ADR-0005). */
public interface EmployeeReadModel {

    PagedResponse<EmployeeView> search(EmployeeSearchCriteria criteria);

    Optional<EmployeeView> findById(long id);

    List<SalaryHistoryEntry> salaryHistory(long employeeId);
}
