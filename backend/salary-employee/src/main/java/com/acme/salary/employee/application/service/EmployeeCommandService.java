package com.acme.salary.employee.application.service;

import com.acme.salary.common.exception.BusinessRuleException;
import com.acme.salary.common.exception.ConflictException;
import com.acme.salary.common.exception.ResourceNotFoundException;
import com.acme.salary.employee.application.model.ChangeSalaryCommand;
import com.acme.salary.employee.application.model.CreateEmployeeCommand;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.model.UpdateEmployeeCommand;
import com.acme.salary.employee.application.port.in.EmployeeCommands;
import com.acme.salary.employee.application.port.out.EmployeeReadModel;
import com.acme.salary.employee.application.port.out.EmployeeRepository;
import com.acme.salary.employee.application.port.out.ReferenceDataRepository;
import com.acme.salary.employee.application.port.out.SalaryHistoryRepository;
import com.acme.salary.employee.domain.Employee;
import com.acme.salary.employee.domain.SalaryChange;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Locale;

/**
 * Orchestrates employee changes: checks references and uniqueness, applies domain rules, and
 * writes the employee and its history in one transaction.
 */
@Service
@Transactional
public class EmployeeCommandService implements EmployeeCommands {

    private final EmployeeRepository employees;
    private final SalaryHistoryRepository history;
    private final ReferenceDataRepository referenceData;
    private final EmployeeReadModel readModel;
    private final Clock clock;

    public EmployeeCommandService(EmployeeRepository employees, SalaryHistoryRepository history,
                                  ReferenceDataRepository referenceData,
                                  EmployeeReadModel readModel, Clock clock) {
        this.employees = employees;
        this.history = history;
        this.referenceData = referenceData;
        this.readModel = readModel;
        this.clock = clock;
    }

    @Override
    public EmployeeView create(CreateEmployeeCommand command) {
        if (!referenceData.countryExists(command.countryCode())) {
            throw new BusinessRuleException("Unknown country: " + command.countryCode());
        }
        requireKnownDepartmentAndTitle(command.departmentId(), command.jobTitleId());
        requireEmailAvailable(command.email(), null);

        Employee employee = Employee.hire(employees.nextEmployeeCode(), command.fullName(),
                command.email(), command.countryCode(), command.departmentId(),
                command.jobTitleId(), command.employmentType(), command.hireDate(),
                command.salary(), today());
        Employee saved = employees.save(employee);
        history.append(saved.getId(), saved.startingSalary());
        return view(saved.getId());
    }

    @Override
    public EmployeeView update(long id, UpdateEmployeeCommand command) {
        Employee employee = load(id);
        requireVersion(employee, command.expectedVersion());
        requireKnownDepartmentAndTitle(command.departmentId(), command.jobTitleId());
        requireEmailAvailable(command.email(), id);

        employee.updateDetails(command.fullName(), command.email(), command.departmentId(),
                command.jobTitleId(), command.employmentType());
        employees.save(employee);
        return view(id);
    }

    @Override
    public EmployeeView changeSalary(long id, ChangeSalaryCommand command) {
        Employee employee = load(id);
        requireVersion(employee, command.expectedVersion());
        LocalDate latestChange = history.latestEffectiveDate(id).orElse(employee.getHireDate());

        SalaryChange change = employee.changeSalary(command.newSalary(), command.effectiveDate(),
                command.reason(), today(), latestChange);
        employees.save(employee);
        history.append(id, change);
        return view(id);
    }

    @Override
    public EmployeeView deactivate(long id) {
        Employee employee = load(id);
        employee.deactivate();
        employees.save(employee);
        return view(id);
    }

    private Employee load(long id) {
        return employees.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
    }

    private EmployeeView view(long id) {
        return readModel.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
    }

    private void requireVersion(Employee employee, long expectedVersion) {
        if (employee.getVersion() != expectedVersion) {
            throw new ConflictException(
                    "This employee was changed by someone else. Reload and try again.");
        }
    }

    private void requireKnownDepartmentAndTitle(int departmentId, int jobTitleId) {
        if (!referenceData.departmentExists(departmentId)) {
            throw new BusinessRuleException("Unknown department: " + departmentId);
        }
        if (!referenceData.jobTitleExists(jobTitleId)) {
            throw new BusinessRuleException("Unknown job title: " + jobTitleId);
        }
    }

    private void requireEmailAvailable(String email, Long excludingId) {
        String normalised = email.strip().toLowerCase(Locale.ROOT);
        if (employees.isEmailTaken(normalised, excludingId)) {
            throw new ConflictException("Email %s is already in use".formatted(normalised));
        }
    }

    private LocalDate today() {
        return LocalDate.now(clock);
    }
}
