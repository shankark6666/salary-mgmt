package com.acme.salary.employee.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;

interface SalaryHistoryJpaRepository extends JpaRepository<SalaryHistoryEntity, Long> {

    @Query("SELECT max(h.effectiveDate) FROM SalaryHistoryEntity h WHERE h.employeeId = :employeeId")
    LocalDate latestEffectiveDate(@Param("employeeId") long employeeId);
}
