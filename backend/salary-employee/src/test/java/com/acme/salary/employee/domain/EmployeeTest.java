package com.acme.salary.employee.domain;

import com.acme.salary.common.exception.BusinessRuleException;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmployeeTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 15);
    private static final LocalDate HIRE_DATE = LocalDate.of(2024, 3, 1);

    @Nested
    class Hiring {

        @Test
        void newHireIsActiveWithNormalisedSalary() {
            Employee employee = hire(new BigDecimal("85000"));

            assertThat(employee.isActive()).isTrue();
            assertThat(employee.getId()).isNull();
            assertThat(employee.getSalary()).isEqualTo(new BigDecimal("85000.00"));
        }

        @Test
        void startingSalaryIsTheFirstHistoryEntry() {
            Employee employee = hire(new BigDecimal("85000"));

            SalaryChange start = employee.startingSalary();

            assertThat(start.previousSalary()).isNull();
            assertThat(start.newSalary()).isEqualTo(new BigDecimal("85000.00"));
            assertThat(start.effectiveDate()).isEqualTo(HIRE_DATE);
            assertThat(start.reason()).isEqualTo("Starting salary");
        }

        @Test
        void emailIsStoredTrimmedAndLowerCase() {
            Employee employee = Employee.hire("EMP-1", "  Jane Doe ", " Jane.Doe@ACME.com ", "US", 1,
                    2, EmploymentType.FULL_TIME, HIRE_DATE, new BigDecimal("1000"), TODAY);

            assertThat(employee.getFullName()).isEqualTo("Jane Doe");
            assertThat(employee.getEmail()).isEqualTo("jane.doe@acme.com");
        }

        @Test
        void rejectsNonPositiveSalary() {
            assertThatThrownBy(() -> hire(BigDecimal.ZERO))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("greater than zero");
        }

        @Test
        void rejectsFractionsOfACent() {
            assertThatThrownBy(() -> hire(new BigDecimal("1000.005")))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("2 decimal places");
        }

        @Test
        void rejectsHireDateInTheFuture() {
            assertThatThrownBy(() -> Employee.hire("EMP-1", "Jane Doe", "jane@acme.com", "US", 1, 2,
                    EmploymentType.FULL_TIME, TODAY.plusDays(1), new BigDecimal("1000"), TODAY))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("future");
        }
    }

    @Nested
    class ChangingSalary {

        @Test
        void recordsPreviousAndNewSalary() {
            Employee employee = hire(new BigDecimal("85000"));

            SalaryChange change = employee.changeSalary(new BigDecimal("90000"),
                    LocalDate.of(2025, 3, 1), "Annual review", TODAY, HIRE_DATE);

            assertThat(employee.getSalary()).isEqualTo(new BigDecimal("90000.00"));
            assertThat(change.previousSalary()).isEqualTo(new BigDecimal("85000.00"));
            assertThat(change.newSalary()).isEqualTo(new BigDecimal("90000.00"));
            assertThat(change.reason()).isEqualTo("Annual review");
        }

        @Test
        void allowsDecreases() {
            Employee employee = hire(new BigDecimal("85000"));

            employee.changeSalary(new BigDecimal("80000"), TODAY, "Moved to part-time role",
                    TODAY, HIRE_DATE);

            assertThat(employee.getSalary()).isEqualTo(new BigDecimal("80000.00"));
        }

        @Test
        void rejectsUnchangedSalary() {
            Employee employee = hire(new BigDecimal("85000"));

            assertThatThrownBy(() -> employee.changeSalary(new BigDecimal("85000.00"), TODAY,
                    "No-op", TODAY, HIRE_DATE))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("same as the current salary");
        }

        @Test
        void rejectsFutureEffectiveDate() {
            Employee employee = hire(new BigDecimal("85000"));

            assertThatThrownBy(() -> employee.changeSalary(new BigDecimal("90000"),
                    TODAY.plusDays(1), "Raise", TODAY, HIRE_DATE))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("future");
        }

        @Test
        void rejectsEffectiveDateBeforeTheLatestChange() {
            Employee employee = hire(new BigDecimal("85000"));
            LocalDate latestChange = LocalDate.of(2025, 3, 1);

            assertThatThrownBy(() -> employee.changeSalary(new BigDecimal("90000"),
                    latestChange.minusDays(1), "Backdated", TODAY, latestChange))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("2025-03-01");
        }

        @Test
        void requiresAReason() {
            Employee employee = hire(new BigDecimal("85000"));

            assertThatThrownBy(() -> employee.changeSalary(new BigDecimal("90000"), TODAY, "  ",
                    TODAY, HIRE_DATE))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("reason");
        }

        @Test
        void isNotAllowedForInactiveEmployees() {
            Employee employee = hire(new BigDecimal("85000"));
            employee.deactivate();

            assertThatThrownBy(() -> employee.changeSalary(new BigDecimal("90000"), TODAY,
                    "Raise", TODAY, HIRE_DATE))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("inactive");
        }
    }

    @Nested
    class Updating {

        @Test
        void updatesEditableDetails() {
            Employee employee = hire(new BigDecimal("85000"));

            employee.updateDetails("Jane Smith", "jane.smith@acme.com", 3, 4,
                    EmploymentType.PART_TIME);

            assertThat(employee.getFullName()).isEqualTo("Jane Smith");
            assertThat(employee.getEmail()).isEqualTo("jane.smith@acme.com");
            assertThat(employee.getDepartmentId()).isEqualTo(3);
            assertThat(employee.getJobTitleId()).isEqualTo(4);
            assertThat(employee.getEmploymentType()).isEqualTo(EmploymentType.PART_TIME);
        }

        @Test
        void inactiveEmployeesAreReadOnly() {
            Employee employee = hire(new BigDecimal("85000"));
            employee.deactivate();

            assertThatThrownBy(() -> employee.updateDetails("Jane Smith", "jane@acme.com", 1, 2,
                    EmploymentType.FULL_TIME))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("inactive");
        }

        @Test
        void cannotDeactivateTwice() {
            Employee employee = hire(new BigDecimal("85000"));
            employee.deactivate();

            assertThatThrownBy(employee::deactivate)
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("already inactive");
        }
    }

    private static Employee hire(BigDecimal salary) {
        return Employee.hire("EMP-10001", "Jane Doe", "jane.doe@acme.com", "US", 1, 2,
                EmploymentType.FULL_TIME, HIRE_DATE, salary, TODAY);
    }
}
