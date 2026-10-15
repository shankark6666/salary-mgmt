package com.acme.salary.insights.adapter.in.web;

import com.acme.salary.common.api.ApiResponse;
import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.insights.application.model.CountryRolePay;
import com.acme.salary.insights.application.model.OrgOverview;
import com.acme.salary.insights.application.model.OutlierCriteria;
import com.acme.salary.insights.application.model.PayOutlier;
import com.acme.salary.insights.application.model.RoleCountryComparison;
import com.acme.salary.insights.application.model.SalaryDistribution;
import com.acme.salary.insights.application.port.in.InsightQueries;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/insights")
public class InsightController {

    private final InsightQueries queries;

    public InsightController(InsightQueries queries) {
        this.queries = queries;
    }

    /** Headcount and pay per country, plus org-wide totals in USD. */
    @GetMapping("/overview")
    public ApiResponse<OrgOverview> overview() {
        return ApiResponse.ok(queries.overview());
    }

    /** "What do we pay each role in India?" — local currency. */
    @GetMapping("/countries/{countryCode}/roles")
    public ApiResponse<CountryRolePay> rolesInCountry(
            @PathVariable @Pattern(regexp = "[A-Z]{2}") String countryCode) {
        return ApiResponse.ok(queries.rolesInCountry(countryCode));
    }

    /** "What do we pay a Senior Engineer in each country?" — compared in USD. */
    @GetMapping("/roles/{jobTitleId}/countries")
    public ApiResponse<RoleCountryComparison> roleAcrossCountries(
            @PathVariable @Positive int jobTitleId) {
        return ApiResponse.ok(queries.roleAcrossCountries(jobTitleId));
    }

    @GetMapping("/countries/{countryCode}/distribution")
    public ApiResponse<SalaryDistribution> distribution(
            @PathVariable @Pattern(regexp = "[A-Z]{2}") String countryCode,
            @RequestParam(defaultValue = "12") @Min(2) @Max(50) int buckets) {
        return ApiResponse.ok(queries.distribution(countryCode, buckets));
    }

    /** People paid at least {@code threshold}% away from the median of their peers. */
    @GetMapping("/outliers")
    public ApiResponse<PagedResponse<PayOutlier>> outliers(
            @RequestParam(defaultValue = "25") @Min(5) @Max(500) int threshold,
            @RequestParam(required = false) @Pattern(regexp = "[A-Z]{2}") String country,
            @RequestParam(required = false) @Positive Integer jobTitleId,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "25") @Min(1) @Max(100) int size) {
        return ApiResponse.ok(queries.outliers(
                new OutlierCriteria(threshold, country, jobTitleId, page, size)));
    }
}
