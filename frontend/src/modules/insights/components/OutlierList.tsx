"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useReferenceData } from "@modules/reference/hooks/useReferenceData";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Pager } from "@shared/components/ui/pager";
import { Select } from "@shared/components/ui/select";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Table, TBody, Td, Th, THead, Tr } from "@shared/components/ui/table";
import { formatMoney, formatPercent } from "@shared/lib/format";
import { SMALL_GROUP } from "../lib/bands";
import { outlierSearchParams, parseOutlierQuery, THRESHOLDS } from "../lib/outlierQuery";
import { useOutliers } from "../hooks/useInsights";
import type { OutlierQuery } from "../types/insights.types";
import { DeviationBar } from "./DeviationBar";
import { FilterBar } from "./FilterBar";

export function OutlierList() {
  const router = useRouter();
  const pathname = usePathname();
  const query = parseOutlierQuery(useSearchParams());
  const { data: reference } = useReferenceData();
  const { data, isError, error, refetch, isFetching, isPending } = useOutliers(query);

  const update = (patch: Partial<OutlierQuery>) => {
    const params = outlierSearchParams({ ...query, page: 0, ...patch }).toString();
    router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false });
  };
  const maxAbs = Math.max(0, ...(data?.content.map((o) => Math.abs(o.deviationPercent)) ?? []));

  return (
    <>
      <FilterBar>
        <label className="space-y-1.5 text-sm">
          <span className="block font-medium">Differs from peers by at least</span>
          <Select value={query.threshold} onChange={(e) => update({ threshold: Number(e.target.value) })} className="w-40">
            {THRESHOLDS.map((t) => <option key={t} value={t}>{t}%</option>)}
          </Select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="block font-medium">Country</span>
          <Select value={query.country ?? ""} onChange={(e) => update({ country: e.target.value || null })} className="w-48">
            <option value="">All countries</option>
            {reference?.countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
          </Select>
        </label>
        <label className="space-y-1.5 text-sm">
          <span className="block font-medium">Job title</span>
          <Select value={query.jobTitleId ?? ""} onChange={(e) => update({ jobTitleId: e.target.value ? Number(e.target.value) : null })} className="w-56">
            <option value="">All job titles</option>
            {reference?.jobTitles.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </label>
      </FilterBar>

      <Card>
        <CardHeader>
          <CardTitle>{data ? `${data.totalElements.toLocaleString("en-US")} people` : "Outliers"} paid far from their peers</CardTitle>
          <CardDescription>
            Peers are active colleagues with the same job title in the same country. Groups under {SMALL_GROUP} people are
            skipped: with so few, the median is one person&apos;s pay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <ErrorState message={error.message} onRetry={() => refetch()} />
          ) : !data ? (
            <Skeleton className="h-64" />
          ) : data.totalElements === 0 ? (
            <EmptyState title="No outliers at this threshold" description="Everyone is paid within this range of their peers. Try a lower threshold." />
          ) : (
            <div className={isFetching && !isPending ? "opacity-60 transition-opacity" : undefined}>
              <Table>
                <THead>
                  <Tr>
                    <Th>Employee</Th>
                    <Th className="hidden md:table-cell">Role</Th>
                    <Th className="text-right">Salary</Th>
                    <Th className="hidden text-right sm:table-cell">Peer median</Th>
                    <Th className="text-right">Difference</Th>
                    <Th className="hidden w-1/5 sm:table-cell"><span className="sr-only">Below or above peers</span></Th>
                  </Tr>
                </THead>
                <TBody>
                  {data.content.map((o) => (
                    <Tr key={o.employeeId}>
                      <Td>
                        <Link href={`/employees/${o.employeeId}`} prefetch={false} className="font-medium hover:underline">
                          {o.fullName}
                        </Link>
                        <p className="text-xs text-muted-foreground">{o.employeeCode} · {o.countryCode}</p>
                      </Td>
                      <Td className="hidden md:table-cell">
                        {o.jobTitleName}
                        <p className="text-xs text-muted-foreground">Peer group of {o.peerCount}</p>
                      </Td>
                      <Td className="text-right tabular-nums">{formatMoney(o.salary, o.currencyCode)}</Td>
                      <Td className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">{formatMoney(o.peerMedian, o.currencyCode)}</Td>
                      <Td className="text-right font-medium tabular-nums">
                        {formatPercent(o.deviationPercent)}
                        <span className="sr-only">{o.deviationPercent > 0 ? " above" : " below"} the peer median</span>
                      </Td>
                      <Td className="hidden sm:table-cell"><DeviationBar deviation={o.deviationPercent} maxAbs={maxAbs} /></Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
              <Pager page={data.page} size={data.size} totalElements={data.totalElements} totalPages={data.totalPages} onPageChange={(page) => update({ page })} />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
