"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, formatMoneyCompact, formatNumber } from "@shared/lib/format";
import { useChartColors } from "../hooks/useChartColors";
import type { CountryPayStats } from "../types/insights.types";
import { TooltipCard } from "./TooltipCard";

const ROW = 36;

/** Magnitude comparison of one measure → single-hue horizontal bars, sorted, value at the tip. */
export function CountryMedianChart({ countries }: { countries: CountryPayStats[] }) {
  const colors = useChartColors();
  const data = [...countries].sort((a, b) => b.medianUsd - a.medianUsd);

  return (
    <div style={{ height: data.length * ROW + 40 }} role="img" aria-label="Median salary by country in US dollars. The same figures are in the table below.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke={colors.grid} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatMoneyCompact(v, "USD")}
            stroke={colors.axis}
            tick={{ fill: colors.muted, fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="countryName"
            width={124}
            stroke={colors.axis}
            tick={{ fill: colors.muted, fontSize: 12 }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: colors.grid, opacity: 0.4 }}
            content={({ active, payload }) => {
              const row = active ? (payload?.[0]?.payload as CountryPayStats | undefined) : undefined;
              return row ? (
                <TooltipCard
                  title={`${row.countryName} · median salary`}
                  value={formatMoney(row.medianUsd, "USD")}
                  rows={[
                    ["In local currency", formatMoney(row.median, row.currencyCode)],
                    ["People", formatNumber(row.headcount)]
                  ]}
                />
              ) : null;
            }}
          />
          <Bar dataKey="medianUsd" fill={colors.series} maxBarSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
            <LabelList
              dataKey="medianUsd"
              position="right"
              formatter={(v) => formatMoneyCompact(Number(v), "USD")}
              style={{ fill: "currentColor", fontSize: 12 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
