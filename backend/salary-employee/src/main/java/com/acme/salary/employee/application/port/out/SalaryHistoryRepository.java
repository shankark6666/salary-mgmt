package com.acme.salary.employee.application.port.out;

import com.acme.salary.employee.domain.SalaryChange;

import java.time.LocalDate;
import java.util.Optional;

public interface SalaryHistoryRepository {

    /** @param changedBy username recorded for the audit trail */
    void append(long employeeId, SalaryChange change, String changedBy);

    Optional<LocalDate> latestEffectiveDate(long employeeId);
}
