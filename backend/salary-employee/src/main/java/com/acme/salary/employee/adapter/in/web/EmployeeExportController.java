package com.acme.salary.employee.adapter.in.web;

import com.acme.salary.employee.application.model.EmployeeSearchCriteria;
import com.acme.salary.employee.application.model.EmployeeSortField;
import com.acme.salary.employee.application.model.EmployeeStatus;
import com.acme.salary.employee.application.model.SortDirection;
import com.acme.salary.employee.application.port.in.EmployeeExport;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.BufferedWriter;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.util.Arrays;

/**
 * The directory as CSV, with the same filters and order as the screen, so HR exports exactly
 * what they are looking at. Rows stream to the client as they are read. Managers only (see
 * SecurityConfig); every export is audited.
 */
@RestController
public class EmployeeExportController {

    static final String[] HEADER = {
            "Employee code", "Full name", "Email", "Country", "Currency", "Department", "Job title",
            "Employment type", "Hire date", "Annual salary (local)", "Annual salary (USD, reference rate)", "Status"};

    private final EmployeeExport export;
    private final Clock clock;

    public EmployeeExportController(EmployeeExport export, Clock clock) {
        this.export = export;
        this.clock = clock;
    }

    @GetMapping("/api/v1/employees/export")
    public void export(
            @RequestParam(required = false) @Size(max = 100) String q,
            @RequestParam(required = false) @Pattern(regexp = "[A-Z]{2}") String country,
            @RequestParam(required = false) @Positive Integer departmentId,
            @RequestParam(required = false) @Positive Integer jobTitleId,
            @RequestParam(defaultValue = "ACTIVE") EmployeeStatus status,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "ASC") SortDirection direction,
            HttpServletResponse response) throws IOException {
        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria(q, country, departmentId, jobTitleId,
                status, 0, EmployeeExport.MAX_ROWS, EmployeeSortField.fromApiName(sort), direction);

        response.setContentType("text/csv");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"employees-%s.csv\"".formatted(LocalDate.now(clock)));

        BufferedWriter writer = new BufferedWriter(
                new OutputStreamWriter(response.getOutputStream(), StandardCharsets.UTF_8));
        CsvWriter csv = new CsvWriter(writer);
        boolean[] started = {false};
        export.export(criteria, view -> {
            if (!started[0]) {
                csv.writeBom();
                csv.row(Arrays.asList((Object[]) HEADER));
                started[0] = true;
            }
            csv.row(Arrays.asList(
                    view.employeeCode(), view.fullName(), view.email(), view.countryName(),
                    view.currencyCode(), view.departmentName(), view.jobTitleName(),
                    view.employmentType().name(), view.hireDate().toString(), view.salary(),
                    view.salaryUsd(), view.active() ? "Active" : "Inactive"));
        });
        if (!started[0]) {
            csv.writeBom();
            csv.row(Arrays.asList((Object[]) HEADER));
        }
        writer.flush();
    }
}
