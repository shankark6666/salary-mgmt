package com.acme.salary.employee.application.port.in;

import com.acme.salary.employee.application.model.EmployeeSearchCriteria;
import com.acme.salary.employee.application.model.EmployeeView;

import java.util.function.Consumer;

public interface EmployeeExport {

    /** Upper bound on one export, so no request can ask for unbounded work. */
    int MAX_ROWS = 100_000;

    /**
     * Streams every employee matching the criteria (paging ignored) to {@code sink}, in the
     * criteria's sort order, and records the export in the audit log.
     *
     * @return number of rows exported
     */
    int export(EmployeeSearchCriteria criteria, Consumer<EmployeeView> sink);
}
