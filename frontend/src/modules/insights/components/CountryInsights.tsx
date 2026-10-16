"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useReferenceData } from "@modules/reference/hooks/useReferenceData";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Select } from "@shared/components/ui/select";
import { Skeleton } from "@shared/components/ui/skeleton";
import { formatMoney, formatMoneyCompact, formatNumber } from "@shared/lib/format";
import { useDistribution, useOrgOverview, useRolesInCountry } from "../hooks/useInsights";
import { DistributionChart } from "./DistributionChart";
import { FilterBar } from "./FilterBar";
import { RolePayTable } from "./RolePayTable";
import { StatTile } from "./StatTile";

const DEFAULT_COUNTRY = "US";

export function CountryInsights() {
  const router = useRouter();
  const pathname = usePathname();
  const param = useSearchParams().get("country");
  const { data: reference } = useReferenceData();
  const known = reference?.countries.some((c) => c.code === param);
  const country = param && (known || !reference) && /^[A-Z]{2}$/.test(param) ? param : DEFAULT_COUNTRY;

  const overview = useOrgOverview();
  const roles = useRolesInCountry(country);
  const distribution = useDistribution(country);
  const stats = overview.data?.countries.find((c) => c.countryCode === country);
  const refreshing = (roles.isFetching && !roles.isPending) || (distribution.isFetching && !distribution.isPending);

  return (
    <>
      <FilterBar>
        <label className="space-y-1.5 text-sm">
          <span className="block font-medium">Country</span>
          <Select value={country} onChange={(e) => router.replace(`${pathname}?country=${e.target.value}`, { scroll: false })} className="w-56">
            {reference?.countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name} ({c.currencyCode})</option>
            ))}
          </Select>
        </label>
      </FilterBar>

      {/* Refetch keeps the frame: previous render stays, dimmed, until the new country arrives. */}
      <div className={refreshing ? "space-y-4 opacity-60 transition-opacity" : "space-y-4"}>
        <div className="grid gap-4 lg:grid-cols-3">
          {stats ? (
            <>
              <StatTile label="Active employees" value={formatNumber(stats.headcount)} />
              <StatTile label="Median salary" value={formatMoney(stats.median, stats.currencyCode)} detail={`≈ ${formatMoney(stats.medianUsd, "USD")}`} />
              <StatTile label="Annual payroll" value={formatMoneyCompact(stats.payrollUsd, "USD")} detail={`${formatMoney(stats.payrollUsd, "USD")} in US dollars`} />
            </>
          ) : (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Salary distribution</CardTitle>
            <CardDescription>How many people earn within each band, in local currency.</CardDescription>
          </CardHeader>
          <CardContent>
            {distribution.isError ? (
              <ErrorState message={distribution.error.message} onRetry={() => distribution.refetch()} />
            ) : distribution.data ? (
              <DistributionChart distribution={distribution.data} />
            ) : (
              <Skeleton className="h-72" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pay by role</CardTitle>
            <CardDescription>
              Lowest to highest median. The band covers the middle half of salaries (25th to 75th percentile); the dot is
              the median. All rows share one scale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {roles.isError ? (
              <ErrorState message={roles.error.message} onRetry={() => roles.refetch()} />
            ) : roles.data ? (
              <RolePayTable roles={roles.data.roles} currency={roles.data.currencyCode} />
            ) : (
              <Skeleton className="h-64" />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
