package com.acme.salary.employee.adapter.in.web;

import com.acme.salary.common.api.ApiResponse;
import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.employee.adapter.in.web.dto.ChangeSalaryRequest;
import com.acme.salary.employee.adapter.in.web.dto.CreateEmployeeRequest;
import com.acme.salary.employee.adapter.in.web.dto.UpdateEmployeeRequest;
import com.acme.salary.employee.application.model.EmployeeSearchCriteria;
import com.acme.salary.employee.application.model.EmployeeSortField;
import com.acme.salary.employee.application.model.EmployeeStatus;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.model.SalaryHistoryEntry;
import com.acme.salary.employee.application.model.SortDirection;
import com.acme.salary.employee.application.port.in.EmployeeCommands;
import com.acme.salary.employee.application.port.in.EmployeeQueries;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {

    static final int MAX_PAGE_SIZE = 100;

    private final EmployeeQueries queries;
    private final EmployeeCommands commands;

    public EmployeeController(EmployeeQueries queries, EmployeeCommands commands) {
        this.queries = queries;
        this.commands = commands;
    }

    @GetMapping
    public ApiResponse<PagedResponse<EmployeeView>> search(
            @RequestParam(required = false) @Size(max = 100) String q,
            @RequestParam(required = false) @Pattern(regexp = "[A-Z]{2}") String country,
            @RequestParam(required = false) @Positive Integer departmentId,
            @RequestParam(required = false) @Positive Integer jobTitleId,
            @RequestParam(defaultValue = "ACTIVE") EmployeeStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(MAX_PAGE_SIZE) int size,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "ASC") SortDirection direction) {
        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria(q, country, departmentId,
                jobTitleId, status, page, size, EmployeeSortField.fromApiName(sort), direction);
        return ApiResponse.ok(queries.search(criteria));
    }

    @GetMapping("/{id}")
    public ApiResponse<EmployeeView> get(@PathVariable long id) {
        return ApiResponse.ok(queries.get(id));
    }

    @GetMapping("/{id}/salary-history")
    public ApiResponse<List<SalaryHistoryEntry>> salaryHistory(@PathVariable long id) {
        return ApiResponse.ok(queries.salaryHistory(id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeView>> create(
            @Valid @RequestBody CreateEmployeeRequest request) {
        EmployeeView created = commands.create(request.toCommand());
        return ResponseEntity.created(URI.create("/api/v1/employees/" + created.id()))
                .body(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    public ApiResponse<EmployeeView> update(@PathVariable long id,
                                            @Valid @RequestBody UpdateEmployeeRequest request) {
        return ApiResponse.ok(commands.update(id, request.toCommand()));
    }

    @PostMapping("/{id}/salary-changes")
    public ApiResponse<EmployeeView> changeSalary(@PathVariable long id,
                                                  @Valid @RequestBody ChangeSalaryRequest request) {
        return ApiResponse.ok(commands.changeSalary(id, request.toCommand()));
    }

    @PostMapping("/{id}/deactivate")
    public ApiResponse<EmployeeView> deactivate(@PathVariable long id) {
        return ApiResponse.ok(commands.deactivate(id));
    }
}
