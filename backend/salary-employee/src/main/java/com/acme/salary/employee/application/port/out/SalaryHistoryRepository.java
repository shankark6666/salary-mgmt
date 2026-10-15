package com.acme.salary.employee.application.port.out;

import com.acme.salary.employee.domain.SalaryChange;

import java.time.LocalDate;
import java.util.Optional;

public interface SalaryHistoryRepository {

    void append(long employeeId, SalaryChange change);

    Optional<LocalDate> latestEffectiveDate(long employeeId);
}
