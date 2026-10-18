/** Mirrors salary-insights. All figures are over active employees. */
export interface CountryPayStats {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  headcount: number;
  min: number;
  median: number;
  average: number;
  max: number;
  medianUsd: number;
  averageUsd: number;
  payrollUsd: number;
}

export interface OrgOverview {
  headcount: number;
  payrollUsd: number;
  medianUsd: number;
  fxRatesAsOf: string;
  countries: CountryPayStats[];
}

export interface RolePayStats {
  jobTitleId: number;
  jobTitleName: string;
  level: number;
  headcount: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
}

export interface CountryRolePay {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  roles: RolePayStats[];
}

export interface RoleCountryRow {
  countryCode: string;
  countryName: string;
  currencyCode: string;
  headcount: number;
  medianLocal: number;
  p25Usd: number;
  medianUsd: number;
  p75Usd: number;
}

export interface RoleCountryComparison {
  jobTitleId: number;
  jobTitleName: string;
  fxRatesAsOf: string;
  countries: RoleCountryRow[];
}

export interface DistributionBucket {
  lower: number;
  upper: number;
  count: number;
}

export interface SalaryDistribution {
  countryCode: string;
  currencyCode: string;
  headcount: number;
  bucketWidth: number | null;
  buckets: DistributionBucket[];
}

export interface PayOutlier {
  employeeId: number;
  employeeCode: string;
  fullName: string;
  countryCode: string;
  currencyCode: string;
  jobTitleId: number;
  jobTitleName: string;
  salary: number;
  peerMedian: number;
  deviationPercent: number;
  peerCount: number;
}

export interface OutlierQuery {
  threshold: number;
  country: string | null;
  jobTitleId: number | null;
  page: number;
}
