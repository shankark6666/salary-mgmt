package com.acme.salary.employee.adapter.in.web;

import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.common.exception.ResourceNotFoundException;
import com.acme.salary.common.web.GlobalExceptionHandler;
import com.acme.salary.employee.application.model.CreateEmployeeCommand;
import com.acme.salary.employee.application.model.EmployeeSearchCriteria;
import com.acme.salary.employee.application.model.EmployeeSortField;
import com.acme.salary.employee.application.model.EmployeeStatus;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.model.SortDirection;
import com.acme.salary.employee.application.port.in.EmployeeCommands;
import com.acme.salary.employee.application.port.in.EmployeeQueries;
import com.acme.salary.employee.domain.EmploymentType;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EmployeeController.class)
@Import(GlobalExceptionHandler.class)
class EmployeeControllerTest {

    private static final EmployeeView JANE = new EmployeeView(7L, "EMP-00007", "Jane Doe",
            "jane@acme.com", "IN", "India", "INR", 1, "Engineering", 5,
            "Senior Software Engineer", EmploymentType.FULL_TIME, LocalDate.of(2024, 3, 1),
            new BigDecimal("2900000.00"), new BigDecimal("34800.00"), true, 3L);

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private EmployeeQueries queries;

    @MockitoBean
    private EmployeeCommands commands;

    @Test
    void searchUsesSensibleDefaults() throws Exception {
        when(queries.search(any())).thenReturn(new PagedResponse<>(List.of(JANE), 0, 25, 1, 1));

        mvc.perform(get("/api/v1/employees"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].fullName").value("Jane Doe"))
                .andExpect(jsonPath("$.data.content[0].salary").value(2900000.00))
                .andExpect(jsonPath("$.data.content[0].currencyCode").value("INR"))
                .andExpect(jsonPath("$.data.totalElements").value(1));

        assertThat(capturedCriteria()).isEqualTo(new EmployeeSearchCriteria(null, null, null, null,
                EmployeeStatus.ACTIVE, 0, 25, EmployeeSortField.NAME, SortDirection.ASC));
    }

    @Test
    void searchPassesFiltersAndSort() throws Exception {
        when(queries.search(any())).thenReturn(new PagedResponse<>(List.of(), 2, 50, 0, 0));

        mvc.perform(get("/api/v1/employees")
                        .param("q", "jane").param("country", "IN").param("departmentId", "1")
                        .param("jobTitleId", "5").param("status", "ALL").param("page", "2")
                        .param("size", "50").param("sort", "salaryUsd").param("direction", "DESC"))
                .andExpect(status().isOk());

        assertThat(capturedCriteria()).isEqualTo(new EmployeeSearchCriteria("jane", "IN", 1, 5,
                EmployeeStatus.ALL, 2, 50, EmployeeSortField.SALARY_USD, SortDirection.DESC));
    }

    @Test
    void unknownSortFieldIsRejectedWithTheAllowedList() throws Exception {
        mvc.perform(get("/api/v1/employees").param("sort", "password"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("salaryUsd")));
        verify(queries, never()).search(any());
    }

    @Test
    void pageSizeIsCapped() throws Exception {
        mvc.perform(get("/api/v1/employees").param("size", "10000"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.size").exists());
    }

    @Test
    void invalidStatusIsBadRequestNotServerError() throws Exception {
        mvc.perform(get("/api/v1/employees").param("status", "RETIRED"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createReturns201WithLocation() throws Exception {
        when(commands.create(any())).thenReturn(JANE);

        mvc.perform(post("/api/v1/employees").contentType(MediaType.APPLICATION_JSON).content("""
                        {"fullName":"Jane Doe","email":"jane@acme.com","countryCode":"IN",
                         "departmentId":1,"jobTitleId":5,"employmentType":"FULL_TIME",
                         "hireDate":"2024-03-01","salary":2900000}"""))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/employees/7"))
                .andExpect(jsonPath("$.data.employeeCode").value("EMP-00007"));

        ArgumentCaptor<CreateEmployeeCommand> command =
                ArgumentCaptor.forClass(CreateEmployeeCommand.class);
        verify(commands).create(command.capture());
        assertThat(command.getValue().salary()).isEqualByComparingTo("2900000");
    }

    @Test
    void createReportsEveryInvalidField() throws Exception {
        mvc.perform(post("/api/v1/employees").contentType(MediaType.APPLICATION_JSON).content("""
                        {"fullName":"","email":"not-an-email","countryCode":"india",
                         "departmentId":1,"jobTitleId":5,"employmentType":"FULL_TIME",
                         "hireDate":"2024-03-01","salary":1000.555}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.fullName").exists())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.countryCode").exists())
                .andExpect(jsonPath("$.fieldErrors.salary").exists());
        verify(commands, never()).create(any());
    }

    @Test
    void salaryChangeRequiresReasonAndVersion() throws Exception {
        mvc.perform(post("/api/v1/employees/7/salary-changes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"newSalary\":3100000,\"effectiveDate\":\"2026-10-01\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.reason").exists())
                .andExpect(jsonPath("$.fieldErrors.version").exists());
    }

    @Test
    void missingEmployeeIs404() throws Exception {
        when(queries.get(99L)).thenThrow(new ResourceNotFoundException("Employee", 99L));

        mvc.perform(get("/api/v1/employees/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value("RESOURCE_NOT_FOUND"));
    }

    private EmployeeSearchCriteria capturedCriteria() {
        ArgumentCaptor<EmployeeSearchCriteria> captor =
                ArgumentCaptor.forClass(EmployeeSearchCriteria.class);
        verify(queries).search(captor.capture());
        return captor.getValue();
    }
}
