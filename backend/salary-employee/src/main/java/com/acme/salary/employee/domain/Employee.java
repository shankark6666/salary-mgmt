package com.acme.salary.employee.domain;

import com.acme.salary.common.exception.BusinessRuleException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Locale;

/**
 * An employee and the rules for changing them. Plain Java: no framework, no persistence.
 *
 * <p>Salary is an annual, full-time-equivalent base in the currency of the employee's country.
 * It changes only through {@link #changeSalary}, which yields a {@link SalaryChange} for the
 * history — there is no setter, so the audit trail cannot be bypassed.
 *
 * <p>Country and hire date are fixed after hiring: changing country would silently change the
 * salary's currency, and changing hire date would contradict the starting-salary record.
 */
public class Employee {

    static final String STARTING_SALARY_REASON = "Starting salary";

    private final Long id;
    private final String employeeCode;
    private String fullName;
    private String email;
    private final String countryCode;
    private int departmentId;
    private int jobTitleId;
    private EmploymentType employmentType;
    private final LocalDate hireDate;
    private BigDecimal salary;
    private boolean active;
    private final long version;

    private Employee(Long id, String employeeCode, String fullName, String email, String countryCode,
                     int departmentId, int jobTitleId, EmploymentType employmentType,
                     LocalDate hireDate, BigDecimal salary, boolean active, long version) {
        this.id = id;
        this.employeeCode = employeeCode;
        this.fullName = fullName;
        this.email = email;
        this.countryCode = countryCode;
        this.departmentId = departmentId;
        this.jobTitleId = jobTitleId;
        this.employmentType = employmentType;
        this.hireDate = hireDate;
        this.salary = salary;
        this.active = active;
        this.version = version;
    }

    public static Employee hire(String employeeCode, String fullName, String email,
                                String countryCode, int departmentId, int jobTitleId,
                                EmploymentType employmentType, LocalDate hireDate,
                                BigDecimal salary, LocalDate today) {
        if (hireDate.isAfter(today)) {
            throw new BusinessRuleException("Hire date cannot be in the future");
        }
        return new Employee(null, employeeCode, fullName.strip(), normaliseEmail(email),
                countryCode, departmentId, jobTitleId, employmentType, hireDate,
                validSalary(salary), true, 0);
    }

    /** Rebuilds an employee already persisted. Not for creating new ones — use {@link #hire}. */
    public static Employee restore(Long id, String employeeCode, String fullName, String email,
                                   String countryCode, int departmentId, int jobTitleId,
                                   EmploymentType employmentType, LocalDate hireDate,
                                   BigDecimal salary, boolean active, long version) {
        return new Employee(id, employeeCode, fullName, email, countryCode, departmentId,
                jobTitleId, employmentType, hireDate, salary, active, version);
    }

    public SalaryChange startingSalary() {
        return new SalaryChange(null, salary, hireDate, STARTING_SALARY_REASON);
    }

    /**
     * @param latestChangeDate effective date of the most recent history entry; a change cannot be
     *                         backdated before it, or the history would no longer read in order
     */
    public SalaryChange changeSalary(BigDecimal newSalary, LocalDate effectiveDate, String reason,
                                     LocalDate today, LocalDate latestChangeDate) {
        requireActive();
        BigDecimal validated = validSalary(newSalary);
        if (validated.compareTo(salary) == 0) {
            throw new BusinessRuleException("New salary is the same as the current salary");
        }
        if (effectiveDate.isAfter(today)) {
            throw new BusinessRuleException("Effective date cannot be in the future");
        }
        if (effectiveDate.isBefore(latestChangeDate)) {
            throw new BusinessRuleException(
                    "Effective date cannot be before the latest salary change (%s)"
                            .formatted(latestChangeDate));
        }
        if (reason == null || reason.isBlank()) {
            throw new BusinessRuleException("A reason is required for a salary change");
        }

        SalaryChange change = new SalaryChange(salary, validated, effectiveDate, reason.strip());
        salary = validated;
        return change;
    }

    public void updateDetails(String fullName, String email, int departmentId, int jobTitleId,
                              EmploymentType employmentType) {
        requireActive();
        this.fullName = fullName.strip();
        this.email = normaliseEmail(email);
        this.departmentId = departmentId;
        this.jobTitleId = jobTitleId;
        this.employmentType = employmentType;
    }

    public void deactivate() {
        if (!active) {
            throw new BusinessRuleException("Employee is already inactive");
        }
        active = false;
    }

    private void requireActive() {
        if (!active) {
            throw new BusinessRuleException("Employee is inactive and cannot be changed");
        }
    }

    private static BigDecimal validSalary(BigDecimal salary) {
        if (salary == null || salary.signum() <= 0) {
            throw new BusinessRuleException("Salary must be greater than zero");
        }
        if (salary.stripTrailingZeros().scale() > 2) {
            throw new BusinessRuleException("Salary cannot have more than 2 decimal places");
        }
        return salary.setScale(2, RoundingMode.UNNECESSARY);
    }

    private static String normaliseEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    public Long getId() {
        return id;
    }

    public String getEmployeeCode() {
        return employeeCode;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public int getDepartmentId() {
        return departmentId;
    }

    public int getJobTitleId() {
        return jobTitleId;
    }

    public EmploymentType getEmploymentType() {
        return employmentType;
    }

    public LocalDate getHireDate() {
        return hireDate;
    }

    public BigDecimal getSalary() {
        return salary;
    }

    public boolean isActive() {
        return active;
    }

    public long getVersion() {
        return version;
    }
}
