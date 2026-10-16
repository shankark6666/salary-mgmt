import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { insightsApi } from "../api/insights.api";
import type { OutlierQuery } from "../types/insights.types";

// Every key starts with "insights" so an employee change invalidates all of them at once.
export function useOrgOverview() {
  return useQuery({ queryKey: ["insights", "overview"], queryFn: insightsApi.overview });
}

export function useRolesInCountry(countryCode: string) {
  return useQuery({
    queryKey: ["insights", "roles-in-country", countryCode],
    queryFn: () => insightsApi.rolesInCountry(countryCode),
    placeholderData: keepPreviousData
  });
}

export function useDistribution(countryCode: string) {
  return useQuery({
    queryKey: ["insights", "distribution", countryCode],
    queryFn: () => insightsApi.distribution(countryCode),
    placeholderData: keepPreviousData
  });
}

export function useRoleAcrossCountries(jobTitleId: number) {
  return useQuery({
    queryKey: ["insights", "role-across-countries", jobTitleId],
    queryFn: () => insightsApi.roleAcrossCountries(jobTitleId),
    placeholderData: keepPreviousData
  });
}

export function useOutliers(query: OutlierQuery) {
  return useQuery({
    queryKey: ["insights", "outliers", query],
    queryFn: () => insightsApi.outliers(query),
    placeholderData: keepPreviousData
  });
}
