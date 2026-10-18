import type { HttpResourceRequest } from '@angular/common/http';
import type { OutlierQuery } from './insights.types';

const BASE = '/api/v1/insights';

/** Request builders for `apiResource`; path segments are encoded, everything else is a bound param. */
export const insightsRequests = {
  overview: (): HttpResourceRequest => ({ url: `${BASE}/overview` }),
  rolesInCountry: (countryCode: string): HttpResourceRequest => ({
    url: `${BASE}/countries/${encodeURIComponent(countryCode)}/roles`,
  }),
  distribution: (countryCode: string): HttpResourceRequest => ({
    url: `${BASE}/countries/${encodeURIComponent(countryCode)}/distribution`,
    params: { buckets: 12 },
  }),
  roleAcrossCountries: (jobTitleId: number): HttpResourceRequest => ({ url: `${BASE}/roles/${jobTitleId}/countries` }),
  outliers: (query: OutlierQuery): HttpResourceRequest => ({
    url: `${BASE}/outliers`,
    params: {
      threshold: query.threshold,
      page: query.page,
      size: 25,
      ...(query.country ? { country: query.country } : {}),
      ...(query.jobTitleId ? { jobTitleId: query.jobTitleId } : {}),
    },
  }),
};
