package com.acme.salary.insights.application.service;

import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.common.exception.ResourceNotFoundException;
import com.acme.salary.insights.application.model.CountryRolePay;
import com.acme.salary.insights.application.model.OrgOverview;
import com.acme.salary.insights.application.model.OutlierCriteria;
import com.acme.salary.insights.application.model.PayOutlier;
import com.acme.salary.insights.application.model.RoleCountryComparison;
import com.acme.salary.insights.application.model.SalaryDistribution;
import com.acme.salary.insights.application.port.in.InsightQueries;
import com.acme.salary.insights.application.port.out.InsightReadModel;
import com.acme.salary.insights.domain.SalaryScale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class InsightQueryService implements InsightQueries {

    private final InsightReadModel readModel;

    public InsightQueryService(InsightReadModel readModel) {
        this.readModel = readModel;
    }

    @Override
    public OrgOverview overview() {
        InsightReadModel.OrgTotals totals = readModel.orgTotals();
        return new OrgOverview(totals.headcount(), totals.payrollUsd(), totals.medianUsd(),
                readModel.fxRatesAsOf(), readModel.payByCountry());
    }

    @Override
    public CountryRolePay rolesInCountry(String countryCode) {
        InsightReadModel.Country country = country(countryCode);
        return new CountryRolePay(country.code(), country.name(), country.currencyCode(),
                readModel.payByRole(country.code()));
    }

    @Override
    public RoleCountryComparison roleAcrossCountries(int jobTitleId) {
        InsightReadModel.JobTitle title = readModel.findJobTitle(jobTitleId)
                .orElseThrow(() -> new ResourceNotFoundException("Job title", jobTitleId));
        return new RoleCountryComparison(title.id(), title.name(), readModel.fxRatesAsOf(),
                readModel.roleAcrossCountries(jobTitleId));
    }

    @Override
    public SalaryDistribution distribution(String countryCode, int targetBuckets) {
        InsightReadModel.Country country = country(countryCode);
        InsightReadModel.SalaryRange range = readModel.salaryRange(country.code());
        if (range.headcount() == 0) {
            return new SalaryDistribution(country.code(), country.currencyCode(), 0, null, List.of());
        }

        SalaryScale scale = SalaryScale.forRange(range.min(), range.max(), targetBuckets);
        Map<Integer, Long> counts = readModel.bucketCounts(country.code(), scale);
        List<SalaryDistribution.Bucket> buckets = new ArrayList<>(scale.bucketCount());
        for (int i = 0; i < scale.bucketCount(); i++) {
            buckets.add(new SalaryDistribution.Bucket(scale.lowerBound(i), scale.upperBound(i),
                    counts.getOrDefault(i, 0L)));
        }
        return new SalaryDistribution(country.code(), country.currencyCode(), range.headcount(),
                scale.width(), buckets);
    }

    @Override
    public PagedResponse<PayOutlier> outliers(OutlierCriteria criteria) {
        if (criteria.countryCode() != null) {
            country(criteria.countryCode());
        }
        return readModel.outliers(criteria);
    }

    private InsightReadModel.Country country(String code) {
        return readModel.findCountry(code)
                .orElseThrow(() -> new ResourceNotFoundException("Country", code));
    }
}
