import { request } from "@shared/api/client";
import type { Page } from "@shared/types/api.types";
import type {
  CountryRolePay,
  OrgOverview,
  OutlierQuery,
  PayOutlier,
  RoleCountryComparison,
  SalaryDistribution
} from "../types/insights.types";

const BASE = "/api/v1/insights";

export const insightsApi = {
  overview: () => request<OrgOverview>({ url: `${BASE}/overview` }),
  rolesInCountry: (countryCode: string) =>
    request<CountryRolePay>({ url: `${BASE}/countries/${encodeURIComponent(countryCode)}/roles` }),
  roleAcrossCountries: (jobTitleId: number) =>
    request<RoleCountryComparison>({ url: `${BASE}/roles/${jobTitleId}/countries` }),
  distribution: (countryCode: string) =>
    request<SalaryDistribution>({
      url: `${BASE}/countries/${encodeURIComponent(countryCode)}/distribution`,
      params: { buckets: 12 }
    }),
  outliers: (query: OutlierQuery) =>
    request<Page<PayOutlier>>({
      url: `${BASE}/outliers`,
      params: {
        threshold: query.threshold,
        country: query.country ?? undefined,
        jobTitleId: query.jobTitleId ?? undefined,
        page: query.page,
        size: 25
      }
    })
};
