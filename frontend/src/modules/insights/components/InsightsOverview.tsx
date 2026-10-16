"use client";

import { ErrorState } from "@shared/components/feedback/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Skeleton } from "@shared/components/ui/skeleton";
import { formatDate, formatMoney, formatMoneyCompact, formatNumber } from "@shared/lib/format";
import { useOrgOverview } from "../hooks/useInsights";
import { CountryMedianChart } from "./CountryMedianChart";
import { CountryPayTable } from "./CountryPayTable";
import { StatTile } from "./StatTile";

export function InsightsOverview() {
  const { data, isError, error, refetch } = useOrgOverview();

  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const fxNote = `USD at reference rates of ${formatDate(data.fxRatesAsOf)}`;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <StatTile label="Active employees" value={formatNumber(data.headcount)} detail={`Across ${data.countries.length} countries`} />
        <StatTile label="Annual payroll" value={formatMoneyCompact(data.payrollUsd, "USD")} detail={fxNote} />
        <StatTile label="Median salary" value={formatMoney(data.medianUsd, "USD")} detail="Half the company earns more, half less" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Median salary by country</CardTitle>
          <CardDescription>In US dollars so countries are comparable. {fxNote}.</CardDescription>
        </CardHeader>
        <CardContent>
          <CountryMedianChart countries={data.countries} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pay by country</CardTitle>
          <CardDescription>Sorted by payroll. Local currency is what people are actually paid; select a country for its roles and distribution.</CardDescription>
        </CardHeader>
        <CardContent>
          <CountryPayTable countries={data.countries} />
        </CardContent>
      </Card>
    </div>
  );
}
