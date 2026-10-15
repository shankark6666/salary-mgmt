package com.acme.salary.employee.infrastructure.persistence;

import com.acme.salary.employee.domain.EmploymentType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/** Persistence shape of an employee. Business rules live in the domain {@code Employee}. */
@Entity
@Table(name = "employees")
@Getter
@Setter
class EmployeeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_code", nullable = false, updatable = false, length = 20)
    private String employeeCode;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(nullable = false, length = 254)
    private String email;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "country_code", nullable = false, updatable = false, length = 2)
    private String countryCode;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "department_id", nullable = false)
    private int departmentId;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "job_title_id", nullable = false)
    private int jobTitleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_type", nullable = false, length = 20)
    private EmploymentType employmentType;

    @Column(name = "hire_date", nullable = false, updatable = false)
    private LocalDate hireDate;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal salary;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    @PreUpdate
    void touch() {
        updatedAt = Instant.now();
    }
}
