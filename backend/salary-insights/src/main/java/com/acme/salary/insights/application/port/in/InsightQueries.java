package com.acme.salary.insights.application.port.in;

import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.insights.application.model.CountryRolePay;
import com.acme.salary.insights.application.model.OrgOverview;
import com.acme.salary.insights.application.model.OutlierCriteria;
import com.acme.salary.insights.application.model.PayOutlier;
import com.acme.salary.insights.application.model.RoleCountryComparison;
import com.acme.salary.insights.application.model.SalaryDistribution;

/** Answers to "how do we pay people?" — always over active employees. */
public interface InsightQueries {

    OrgOverview overview();

    CountryRolePay rolesInCountry(String countryCode);

    RoleCountryComparison roleAcrossCountries(int jobTitleId);

    SalaryDistribution distribution(String countryCode, int targetBuckets);

    PagedResponse<PayOutlier> outliers(OutlierCriteria criteria);
}
