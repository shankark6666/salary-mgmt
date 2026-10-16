"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useReferenceData } from "@modules/reference/hooks/useReferenceData";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { Badge } from "@shared/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Select } from "@shared/components/ui/select";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Table, TBody, Td, Th, THead, Tr } from "@shared/components/ui/table";
import { formatDate, formatMoney, formatNumber } from "@shared/lib/format";
import { SMALL_GROUP } from "../lib/bands";
import { useRoleAcrossCountries } from "../hooks/useInsights";
import { FilterBar } from "./FilterBar";
import { RoleComparisonChart } from "./RoleComparisonChart";

const DEFAULT_TITLE = "Senior Software Engineer";

export function RoleComparison() {
  const router = useRouter();
  const pathname = usePathname();
  const param = Number(useSearchParams().get("jobTitleId"));
  const { data: reference } = useReferenceData();
  const titles = reference?.jobTitles ?? [];
  const fallback = titles.find((t) => t.name === DEFAULT_TITLE)?.id ?? titles[0]?.id;
  const jobTitleId = titles.some((t) => t.id === param) ? param : fallback;

  return (
    <>
      <FilterBar>
        <label className="space-y-1.5 text-sm">
          <span className="block font-medium">Job title</span>
          <Select
            value={jobTitleId ?? ""}
            onChange={(e) => router.replace(`${pathname}?jobTitleId=${e.target.value}`, { scroll: false })}
            className="w-64"
          >
            {titles.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </label>
      </FilterBar>
      {jobTitleId ? <Comparison jobTitleId={jobTitleId} /> : <Skeleton className="h-80" />}
    </>
  );
}

function Comparison({ jobTitleId }: { jobTitleId: number }) {
  const { data, isError, error, refetch, isFetching, isPending } = useRoleAcrossCountries(jobTitleId);

  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!data) return <Skeleton className="h-80" />;
  if (data.countries.length === 0) {
    return <EmptyState title="Nobody holds this role yet" description="Choose another job title." />;
  }

  return (
    <div className={isFetching && !isPending ? "space-y-4 opacity-60 transition-opacity" : "space-y-4"}>
      <Card>
        <CardHeader>
          <CardTitle>{data.jobTitleName}: pay by country</CardTitle>
          <CardDescription>
            In US dollars at reference rates of {formatDate(data.fxRatesAsOf)}. Band: middle half of salaries · dot: median.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RoleComparisonChart rows={data.countries} />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5">
          <Table>
            <THead>
              <Tr>
                <Th>Country</Th>
                <Th className="text-right">People</Th>
                <Th className="text-right">Median (local)</Th>
                <Th className="text-right">25th pct (USD)</Th>
                <Th className="text-right">Median (USD)</Th>
                <Th className="text-right">75th pct (USD)</Th>
              </Tr>
            </THead>
            <TBody>
              {data.countries.map((r) => (
                <Tr key={r.countryCode}>
                  <Td>
                    <span className="font-medium">{r.countryName}</span>
                    {r.headcount < SMALL_GROUP ? <Badge tone="warning" className="ml-2">Small group</Badge> : null}
                  </Td>
                  <Td className="text-right tabular-nums">{formatNumber(r.headcount)}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(r.medianLocal, r.currencyCode)}</Td>
                  <Td className="text-right tabular-nums text-muted-foreground">{formatMoney(r.p25Usd, "USD")}</Td>
                  <Td className="text-right font-medium tabular-nums">{formatMoney(r.medianUsd, "USD")}</Td>
                  <Td className="text-right tabular-nums text-muted-foreground">{formatMoney(r.p75Usd, "USD")}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
