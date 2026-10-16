package com.acme.salary.employee.application.service;

import com.acme.salary.common.exception.BusinessRuleException;
import com.acme.salary.employee.application.model.EmployeeSearchCriteria;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.port.in.EmployeeExport;
import com.acme.salary.employee.application.port.out.AuditLog;
import com.acme.salary.employee.application.port.out.CurrentActor;
import com.acme.salary.employee.application.port.out.EmployeeReadModel;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.function.Consumer;

@Service
public class EmployeeExportService implements EmployeeExport {

    static final String ACTION = "EMPLOYEE_EXPORT";

    private final EmployeeReadModel readModel;
    private final AuditLog auditLog;
    private final CurrentActor actor;

    public EmployeeExportService(EmployeeReadModel readModel, AuditLog auditLog, CurrentActor actor) {
        this.readModel = readModel;
        this.auditLog = auditLog;
        this.actor = actor;
    }

    /**
     * The audit entry is written before any row leaves, in the same transaction: an export that
     * produced data always has a record, even if the client disconnects midway.
     */
    @Override
    @Transactional
    public int export(EmployeeSearchCriteria criteria, Consumer<EmployeeView> sink) {
        long matches = readModel.count(criteria);
        if (matches > MAX_ROWS) {
            throw new BusinessRuleException("Export is limited to %,d rows; this selection has %,d. Narrow the filters."
                    .formatted(MAX_ROWS, matches));
        }
        auditLog.record(actor.username(), ACTION, describe(criteria, matches));

        int[] written = {0};
        readModel.stream(criteria, view -> {
            sink.accept(view);
            written[0]++;
        });
        return written[0];
    }

    static String describe(EmployeeSearchCriteria c, long rows) {
        return "rows=%d status=%s q=%s country=%s departmentId=%s jobTitleId=%s sort=%s %s".formatted(
                rows, c.status(), c.query() == null ? "" : c.query(), nullable(c.countryCode()),
                nullable(c.departmentId()), nullable(c.jobTitleId()), c.sort().apiName(), c.direction());
    }

    private static String nullable(Object value) {
        return value == null ? "any" : value.toString();
    }
}
