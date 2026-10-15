package com.acme.salary.employee.adapter.in.web;

import com.acme.salary.common.api.ApiResponse;
import com.acme.salary.employee.application.model.ReferenceData;
import com.acme.salary.employee.application.port.in.EmployeeQueries;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reference-data")
public class ReferenceDataController {

    private final EmployeeQueries queries;

    public ReferenceDataController(EmployeeQueries queries) {
        this.queries = queries;
    }

    @GetMapping
    public ApiResponse<ReferenceData> get() {
        return ApiResponse.ok(queries.referenceData());
    }
}
