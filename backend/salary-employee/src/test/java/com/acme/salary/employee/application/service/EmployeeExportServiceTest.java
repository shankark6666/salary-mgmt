package com.acme.salary.employee.application.service;

import com.acme.salary.common.exception.BusinessRuleException;
import com.acme.salary.employee.application.model.EmployeeSearchCriteria;
import com.acme.salary.employee.application.model.EmployeeSortField;
import com.acme.salary.employee.application.model.EmployeeStatus;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.model.SortDirection;
import com.acme.salary.employee.application.port.in.EmployeeExport;
import com.acme.salary.employee.application.port.out.AuditLog;
import com.acme.salary.employee.application.port.out.CurrentActor;
import com.acme.salary.employee.application.port.out.EmployeeReadModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmployeeExportServiceTest {

    private static final EmployeeSearchCriteria CRITERIA = new EmployeeSearchCriteria("sharma", "IN", null, null,
            EmployeeStatus.ACTIVE, 0, EmployeeExport.MAX_ROWS, EmployeeSortField.NAME, SortDirection.ASC);

    private final EmployeeReadModel readModel = mock(EmployeeReadModel.class);
    private final AuditLog auditLog = mock(AuditLog.class);
    private final CurrentActor actor = mock(CurrentActor.class);
    private EmployeeExportService service;

    @BeforeEach
    void setUp() {
        service = new EmployeeExportService(readModel, auditLog, actor);
        when(actor.username()).thenReturn("hana.manager");
    }

    @Test
    @SuppressWarnings("unchecked")
    void auditsBeforeStreamingAndCountsRows() {
        when(readModel.count(CRITERIA)).thenReturn(2L);
        EmployeeView row = mock(EmployeeView.class);
        doAnswer(invocation -> {
            Consumer<EmployeeView> sink = invocation.getArgument(1);
            sink.accept(row);
            sink.accept(row);
            return null;
        }).when(readModel).stream(eq(CRITERIA), any());
        List<EmployeeView> received = new ArrayList<>();

        int exported = service.export(CRITERIA, received::add);

        assertThat(exported).isEqualTo(2);
        assertThat(received).hasSize(2);
        InOrder order = inOrder(auditLog, readModel);
        order.verify(auditLog).record(eq("hana.manager"), eq("EMPLOYEE_EXPORT"), contains("rows=2"));
        order.verify(readModel).stream(eq(CRITERIA), any());
    }

    @Test
    void auditRecordsTheFiltersUsed() {
        when(readModel.count(CRITERIA)).thenReturn(0L);

        service.export(CRITERIA, view -> { });

        verify(auditLog).record(anyString(), anyString(), contains("q=sharma country=IN"));
    }

    @Test
    void refusesExportsOverTheCapWithoutAuditingOrReadingRows() {
        when(readModel.count(CRITERIA)).thenReturn((long) EmployeeExport.MAX_ROWS + 1);

        assertThatThrownBy(() -> service.export(CRITERIA, view -> { }))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Narrow the filters");
        verify(auditLog, never()).record(anyString(), anyString(), anyString());
        verify(readModel, never()).stream(any(), any());
    }
}
