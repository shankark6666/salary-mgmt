package com.acme.salary.employee.application.port.out;

import com.acme.salary.employee.domain.Employee;

import java.util.Optional;

public interface EmployeeRepository {

    Optional<Employee> findById(long id);

    /** Persists and returns the employee with its assigned id and current version. */
    Employee save(Employee employee);

    /** Case-insensitive; {@code excludingId} lets an employee keep their own email on update. */
    boolean isEmailTaken(String email, Long excludingId);

    String nextEmployeeCode();
}
