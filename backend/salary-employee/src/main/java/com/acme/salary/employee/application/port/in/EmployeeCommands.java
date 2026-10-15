package com.acme.salary.employee.application.port.in;

import com.acme.salary.employee.application.model.ChangeSalaryCommand;
import com.acme.salary.employee.application.model.CreateEmployeeCommand;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.model.UpdateEmployeeCommand;

public interface EmployeeCommands {

    EmployeeView create(CreateEmployeeCommand command);

    EmployeeView update(long id, UpdateEmployeeCommand command);

    EmployeeView changeSalary(long id, ChangeSalaryCommand command);

    EmployeeView deactivate(long id);
}
