package com.acme.salary.employee.infrastructure.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Append-only: Hibernate will never issue an UPDATE for this entity. */
@Entity
@Immutable
@Table(name = "salary_history")
@Getter
@Setter
class SalaryHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private long employeeId;

    @Column(name = "previous_salary", precision = 14, scale = 2)
    private BigDecimal previousSalary;

    @Column(name = "new_salary", nullable = false, precision = 14, scale = 2)
    private BigDecimal newSalary;

    @Column(name = "effective_date", nullable = false)
    private LocalDate effectiveDate;

    @Column(nullable = false, length = 500)
    private String reason;

    @Column(name = "changed_by", nullable = false, updatable = false, length = 100)
    private String changedBy;

    @Column(name = "changed_at", nullable = false, insertable = false, updatable = false)
    private Instant changedAt;
}
