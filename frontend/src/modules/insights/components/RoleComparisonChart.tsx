"use client";

import { Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, formatMoneyCompact, formatNumber } from "@shared/lib/format";
import { useChartColors } from "../hooks/useChartColors";
import type { RoleCountryRow } from "../types/insights.types";
import { TooltipCard } from "./TooltipCard";

const ROW = 40;

/**
 * One role across countries on a single USD axis: the band is the middle half of salaries
 * (p25–p75), the dot the median. One series, so one hue (band = a lighter step of it).
 */
export function RoleComparisonChart({ rows }: { rows: RoleCountryRow[] }) {
  const colors = useChartColors();
  const data = [...rows]
    .sort((a, b) => b.medianUsd - a.medianUsd)
    .map((r) => ({ ...r, band: [r.p25Usd, r.p75Usd] as [number, number] }));

  return (
    <div style={{ height: data.length * ROW + 40 }} role="img" aria-label="Pay range by country in US dollars. The same figures are in the table below.">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke={colors.grid} />
          <XAxis
            type="number"
            domain={[0, "auto"]}
            tickFormatter={(v: number) => formatMoneyCompact(v, "USD")}
            stroke={colors.axis}
            tick={{ fill: colors.muted, fontSize: 12 }}
            tickLine={false}
          />
          <YAxis type="category" dataKey="countryName" width={124} stroke={colors.axis} tick={{ fill: colors.muted, fontSize: 12 }} tickLine={false} />
          <Tooltip
            cursor={{ fill: colors.grid, opacity: 0.4 }}
            content={({ active, payload }) => {
              const row = active ? (payload?.[0]?.payload as RoleCountryRow | undefined) : undefined;
              return row ? (
                <TooltipCard
                  title={`${row.countryName} · median`}
                  value={formatMoney(row.medianUsd, "USD")}
                  rows={[
                    ["Middle 50%", `${formatMoneyCompact(row.p25Usd, "USD")} – ${formatMoneyCompact(row.p75Usd, "USD")}`],
                    ["Median, local", formatMoney(row.medianLocal, row.currencyCode)],
                    ["People", formatNumber(row.headcount)]
                  ]}
                />
              ) : null;
            }}
          />
          <Bar dataKey="band" fill={colors.band} maxBarSize={12} radius={4} isAnimationActive={false} />
          <Scatter
            dataKey="medianUsd"
            fill={colors.series}
            isAnimationActive={false}
            shape={(props: { cx?: number; cy?: number }) => (
              // 2px surface ring keeps the dot legible where it sits on the band.
              <circle cx={props.cx} cy={props.cy} r={6} fill={colors.series} stroke="var(--color-card)" strokeWidth={2} />
            )}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
