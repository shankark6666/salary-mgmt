package com.acme.salary.employee.infrastructure.persistence;

import com.acme.salary.employee.application.port.out.EmployeeRepository;
import com.acme.salary.employee.application.port.out.SalaryHistoryRepository;
import com.acme.salary.employee.domain.Employee;
import com.acme.salary.employee.domain.SalaryChange;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

/** Write side: maps the domain {@link Employee} to and from JPA entities. */
@Repository
class EmployeePersistenceAdapter implements EmployeeRepository, SalaryHistoryRepository {

    private final EmployeeJpaRepository employees;
    private final SalaryHistoryJpaRepository history;

    EmployeePersistenceAdapter(EmployeeJpaRepository employees, SalaryHistoryJpaRepository history) {
        this.employees = employees;
        this.history = history;
    }

    @Override
    public Optional<Employee> findById(long id) {
        return employees.findById(id).map(EmployeePersistenceAdapter::toDomain);
    }

    /**
     * Updates go through the managed entity so Hibernate's {@code @Version} check guards against
     * a concurrent transaction committing between our read and our write.
     */
    @Override
    public Employee save(Employee employee) {
        EmployeeEntity entity = employee.getId() == null
                ? newEntity(employee)
                : employees.findById(employee.getId()).orElseThrow();
        copyMutableFields(employee, entity);
        return toDomain(employees.saveAndFlush(entity));
    }

    @Override
    public boolean isEmailTaken(String email, Long excludingId) {
        return employees.isEmailTaken(email, excludingId);
    }

    @Override
    public String nextEmployeeCode() {
        return "EMP-%05d".formatted(employees.nextCodeNumber());
    }

    @Override
    public void append(long employeeId, SalaryChange change, String changedBy) {
        SalaryHistoryEntity entity = new SalaryHistoryEntity();
        entity.setEmployeeId(employeeId);
        entity.setPreviousSalary(change.previousSalary());
        entity.setNewSalary(change.newSalary());
        entity.setEffectiveDate(change.effectiveDate());
        entity.setReason(change.reason());
        entity.setChangedBy(changedBy);
        history.saveAndFlush(entity);
    }

    @Override
    public Optional<LocalDate> latestEffectiveDate(long employeeId) {
        return Optional.ofNullable(history.latestEffectiveDate(employeeId));
    }

    private static EmployeeEntity newEntity(Employee employee) {
        EmployeeEntity entity = new EmployeeEntity();
        entity.setEmployeeCode(employee.getEmployeeCode());
        entity.setCountryCode(employee.getCountryCode());
        entity.setHireDate(employee.getHireDate());
        return entity;
    }

    private static void copyMutableFields(Employee employee, EmployeeEntity entity) {
        entity.setFullName(employee.getFullName());
        entity.setEmail(employee.getEmail());
        entity.setDepartmentId(employee.getDepartmentId());
        entity.setJobTitleId(employee.getJobTitleId());
        entity.setEmploymentType(employee.getEmploymentType());
        entity.setSalary(employee.getSalary());
        entity.setActive(employee.isActive());
    }

    private static Employee toDomain(EmployeeEntity e) {
        return Employee.restore(e.getId(), e.getEmployeeCode(), e.getFullName(), e.getEmail(),
                e.getCountryCode(), e.getDepartmentId(), e.getJobTitleId(), e.getEmploymentType(),
                e.getHireDate(), e.getSalary(), e.isActive(), e.getVersion());
    }
}
