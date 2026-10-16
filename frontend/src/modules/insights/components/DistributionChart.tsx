"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Table, TBody, Td, Th, THead, Tr } from "@shared/components/ui/table";
import { formatMoney, formatMoneyCompact, formatNumber } from "@shared/lib/format";
import { useChartColors } from "../hooks/useChartColors";
import type { SalaryDistribution } from "../types/insights.types";
import { TooltipCard } from "./TooltipCard";

/** Histogram: magnitude per salary band, one hue, touching columns separated by a 2px gap. */
export function DistributionChart({ distribution }: { distribution: SalaryDistribution }) {
  const colors = useChartColors();
  const currency = distribution.currencyCode;
  const data = distribution.buckets.map((b) => ({ ...b, label: formatMoneyCompact(b.lower, currency) }));

  return (
    <>
      <div className="h-72" role="img" aria-label={`Salary distribution in ${currency}. The same figures are in the table view.`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: 0 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke={colors.grid} />
            <XAxis dataKey="label" stroke={colors.axis} tick={{ fill: colors.muted, fontSize: 12 }} tickLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} stroke={colors.axis} tick={{ fill: colors.muted, fontSize: 12 }} tickLine={false} width={44} />
            <Tooltip
              cursor={{ fill: colors.grid, opacity: 0.4 }}
              content={({ active, payload }) => {
                const bucket = active ? (payload?.[0]?.payload as (typeof data)[number] | undefined) : undefined;
                return bucket ? (
                  <TooltipCard
                    title={`${formatMoney(bucket.lower, currency)} – ${formatMoney(bucket.upper, currency)}`}
                    value={`${formatNumber(bucket.count)} ${bucket.count === 1 ? "person" : "people"}`}
                    rows={[["Share", `${((bucket.count / distribution.headcount) * 100).toFixed(1)}%`]]}
                  />
                ) : null;
              }}
            />
            <Bar dataKey="count" fill={colors.series} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View as table</summary>
        <Table className="mt-2">
          <THead>
            <Tr>
              <Th>Salary band ({currency})</Th>
              <Th className="text-right">People</Th>
              <Th className="text-right">Share</Th>
            </Tr>
          </THead>
          <TBody>
            {distribution.buckets.map((b) => (
              <Tr key={b.lower}>
                <Td className="tabular-nums">{formatMoney(b.lower, currency)} – {formatMoney(b.upper, currency)}</Td>
                <Td className="text-right tabular-nums">{formatNumber(b.count)}</Td>
                <Td className="text-right tabular-nums">{((b.count / distribution.headcount) * 100).toFixed(1)}%</Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      </details>
    </>
  );
}
