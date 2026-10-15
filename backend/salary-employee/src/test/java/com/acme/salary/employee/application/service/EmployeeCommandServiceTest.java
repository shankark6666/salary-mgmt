package com.acme.salary.employee.application.service;

import com.acme.salary.common.exception.BusinessRuleException;
import com.acme.salary.common.exception.ConflictException;
import com.acme.salary.common.exception.ResourceNotFoundException;
import com.acme.salary.employee.application.model.ChangeSalaryCommand;
import com.acme.salary.employee.application.model.CreateEmployeeCommand;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.model.UpdateEmployeeCommand;
import com.acme.salary.employee.application.port.out.CurrentActor;
import com.acme.salary.employee.application.port.out.EmployeeReadModel;
import com.acme.salary.employee.application.port.out.EmployeeRepository;
import com.acme.salary.employee.application.port.out.ReferenceDataRepository;
import com.acme.salary.employee.application.port.out.SalaryHistoryRepository;
import com.acme.salary.employee.domain.Employee;
import com.acme.salary.employee.domain.EmploymentType;
import com.acme.salary.employee.domain.SalaryChange;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeCommandServiceTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 15);
    private static final Clock CLOCK =
            Clock.fixed(Instant.parse("2026-10-15T10:00:00Z"), ZoneOffset.UTC);
    private static final LocalDate HIRE_DATE = LocalDate.of(2024, 3, 1);

    @Mock
    private EmployeeRepository employees;
    @Mock
    private SalaryHistoryRepository history;
    @Mock
    private ReferenceDataRepository referenceData;
    @Mock
    private EmployeeReadModel readModel;
    @Mock
    private CurrentActor actor;

    private EmployeeCommandService service;
    private final EmployeeView view = mock(EmployeeView.class);

    @BeforeEach
    void setUp() {
        service = new EmployeeCommandService(employees, history, referenceData, readModel, actor, CLOCK);
        lenient().when(actor.username()).thenReturn("hana.manager");
        lenient().when(referenceData.countryExists(anyString())).thenReturn(true);
        lenient().when(referenceData.departmentExists(anyInt())).thenReturn(true);
        lenient().when(referenceData.jobTitleExists(anyInt())).thenReturn(true);
        lenient().when(employees.save(any())).thenAnswer(invocation -> withId(invocation.getArgument(0)));
        lenient().when(readModel.findById(anyLong())).thenReturn(Optional.of(view));
    }

    @Nested
    class Create {

        @Test
        void savesEmployeeWithGeneratedCodeAndRecordsStartingSalary() {
            when(employees.nextEmployeeCode()).thenReturn("EMP-10001");

            EmployeeView result = service.create(createCommand("jane@acme.com"));

            ArgumentCaptor<Employee> saved = ArgumentCaptor.forClass(Employee.class);
            verify(employees).save(saved.capture());
            assertThat(saved.getValue().getEmployeeCode()).isEqualTo("EMP-10001");
            verify(history).append(eq(1L), eq(new SalaryChange(null, new BigDecimal("85000.00"),
                    HIRE_DATE, "Starting salary")), eq("hana.manager"));
            assertThat(result).isSameAs(view);
        }

        @Test
        void rejectsEmailAlreadyInUse() {
            when(employees.isEmailTaken("jane@acme.com", null)).thenReturn(true);

            assertThatThrownBy(() -> service.create(createCommand("jane@acme.com")))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("jane@acme.com");
            verify(employees, never()).save(any());
        }

        @Test
        void checksEmailUniquenessAfterNormalising() {
            when(employees.isEmailTaken("jane@acme.com", null)).thenReturn(true);

            assertThatThrownBy(() -> service.create(createCommand("  Jane@ACME.com ")))
                    .isInstanceOf(ConflictException.class);
        }

        @Test
        void rejectsUnknownCountry() {
            when(referenceData.countryExists("XX")).thenReturn(false);
            CreateEmployeeCommand command = new CreateEmployeeCommand("Jane Doe", "jane@acme.com",
                    "XX", 1, 2, EmploymentType.FULL_TIME, HIRE_DATE, new BigDecimal("85000"));

            assertThatThrownBy(() -> service.create(command))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Unknown country: XX");
        }

        @Test
        void rejectsUnknownDepartment() {
            when(referenceData.departmentExists(1)).thenReturn(false);

            assertThatThrownBy(() -> service.create(createCommand("jane@acme.com")))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("Unknown department: 1");
        }
    }

    @Nested
    class Update {

        @Test
        void appliesDetailsWhenVersionMatches() {
            when(employees.findById(1L)).thenReturn(Optional.of(existing(3)));

            service.update(1L, new UpdateEmployeeCommand(3, "Jane Smith", "jane.smith@acme.com",
                    1, 2, EmploymentType.PART_TIME));

            ArgumentCaptor<Employee> saved = ArgumentCaptor.forClass(Employee.class);
            verify(employees).save(saved.capture());
            assertThat(saved.getValue().getFullName()).isEqualTo("Jane Smith");
        }

        @Test
        void rejectsStaleVersionSoConcurrentEditsAreNotLost() {
            when(employees.findById(1L)).thenReturn(Optional.of(existing(4)));

            assertThatThrownBy(() -> service.update(1L, new UpdateEmployeeCommand(3, "Jane Smith",
                    "jane@acme.com", 1, 2, EmploymentType.FULL_TIME)))
                    .isInstanceOf(ConflictException.class)
                    .hasMessageContaining("changed by someone else");
            verify(employees, never()).save(any());
        }

        @Test
        void allowsKeepingOwnEmail() {
            when(employees.findById(1L)).thenReturn(Optional.of(existing(0)));

            service.update(1L, new UpdateEmployeeCommand(0, "Jane Doe", "jane.doe@acme.com", 1, 2,
                    EmploymentType.FULL_TIME));

            verify(employees).isEmailTaken("jane.doe@acme.com", 1L);
        }

        @Test
        void unknownEmployeeIsNotFound() {
            when(employees.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> service.update(99L, new UpdateEmployeeCommand(0, "x",
                    "x@acme.com", 1, 2, EmploymentType.FULL_TIME)))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    class ChangeSalary {

        @Test
        void savesNewSalaryAndAppendsHistory() {
            when(employees.findById(1L)).thenReturn(Optional.of(existing(0)));
            when(history.latestEffectiveDate(1L)).thenReturn(Optional.of(HIRE_DATE));

            service.changeSalary(1L, new ChangeSalaryCommand(0, new BigDecimal("90000"), TODAY,
                    "Annual review"));

            verify(history).append(1L, new SalaryChange(new BigDecimal("85000.00"),
                    new BigDecimal("90000.00"), TODAY, "Annual review"), "hana.manager");
            ArgumentCaptor<Employee> saved = ArgumentCaptor.forClass(Employee.class);
            verify(employees).save(saved.capture());
            assertThat(saved.getValue().getSalary()).isEqualTo(new BigDecimal("90000.00"));
        }

        @Test
        void cannotBeBackdatedBeforeLatestChange() {
            when(employees.findById(1L)).thenReturn(Optional.of(existing(0)));
            when(history.latestEffectiveDate(1L)).thenReturn(Optional.of(LocalDate.of(2026, 3, 1)));

            assertThatThrownBy(() -> service.changeSalary(1L, new ChangeSalaryCommand(0,
                    new BigDecimal("90000"), LocalDate.of(2026, 2, 1), "Backdated")))
                    .isInstanceOf(BusinessRuleException.class);
            verify(history, never()).append(anyLong(), any(), any());
        }

        @Test
        void rejectsStaleVersion() {
            when(employees.findById(1L)).thenReturn(Optional.of(existing(2)));

            assertThatThrownBy(() -> service.changeSalary(1L, new ChangeSalaryCommand(1,
                    new BigDecimal("90000"), TODAY, "Raise")))
                    .isInstanceOf(ConflictException.class);
        }
    }

    @Test
    void deactivatePersistsInactiveEmployee() {
        when(employees.findById(1L)).thenReturn(Optional.of(existing(0)));

        service.deactivate(1L);

        ArgumentCaptor<Employee> saved = ArgumentCaptor.forClass(Employee.class);
        verify(employees).save(saved.capture());
        assertThat(saved.getValue().isActive()).isFalse();
    }

    @Test
    void createRejectsFutureHireDateUsingTheInjectedClock() {
        CreateEmployeeCommand command = new CreateEmployeeCommand("Jane Doe", "jane@acme.com", "US",
                1, 2, EmploymentType.FULL_TIME, TODAY.plusDays(1), new BigDecimal("85000"));
        when(employees.isEmailTaken(anyString(), isNull())).thenReturn(false);

        assertThatThrownBy(() -> service.create(command))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("future");
    }

    private static CreateEmployeeCommand createCommand(String email) {
        return new CreateEmployeeCommand("Jane Doe", email, "US", 1, 2, EmploymentType.FULL_TIME,
                HIRE_DATE, new BigDecimal("85000"));
    }

    private static Employee existing(long version) {
        return Employee.restore(1L, "EMP-00001", "Jane Doe", "jane.doe@acme.com", "US", 1, 2,
                EmploymentType.FULL_TIME, HIRE_DATE, new BigDecimal("85000.00"), true, version);
    }

    private static Employee withId(Employee e) {
        return Employee.restore(e.getId() == null ? 1L : e.getId(), e.getEmployeeCode(),
                e.getFullName(), e.getEmail(), e.getCountryCode(), e.getDepartmentId(),
                e.getJobTitleId(), e.getEmploymentType(), e.getHireDate(), e.getSalary(),
                e.isActive(), e.getVersion());
    }
}
