package com.acme.salary.insights.application.port.out;

import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.insights.application.model.CountryPayStats;
import com.acme.salary.insights.application.model.OutlierCriteria;
import com.acme.salary.insights.application.model.PayOutlier;
import com.acme.salary.insights.application.model.RoleCountryComparison;
import com.acme.salary.insights.application.model.RolePayStats;
import com.acme.salary.insights.domain.SalaryScale;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Aggregations computed in the database; every query is over active employees. */
public interface InsightReadModel {

    record Country(String code, String name, String currencyCode) {
    }

    record JobTitle(int id, String name) {
    }

    record SalaryRange(long headcount, BigDecimal min, BigDecimal max) {
    }

    record OrgTotals(long headcount, BigDecimal payrollUsd, BigDecimal medianUsd) {
    }

    Optional<Country> findCountry(String code);

    Optional<JobTitle> findJobTitle(int id);

    LocalDate fxRatesAsOf();

    OrgTotals orgTotals();

    List<CountryPayStats> payByCountry();

    List<RolePayStats> payByRole(String countryCode);

    List<RoleCountryComparison.Row> roleAcrossCountries(int jobTitleId);

    SalaryRange salaryRange(String countryCode);

    /** Headcount per bucket index; buckets with nobody in them are absent. */
    Map<Integer, Long> bucketCounts(String countryCode, SalaryScale scale);

    PagedResponse<PayOutlier> outliers(OutlierCriteria criteria);
}
