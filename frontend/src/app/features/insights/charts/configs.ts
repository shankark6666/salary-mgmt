import type { ChartConfiguration, Plugin, TooltipItem } from 'chart.js';
import { formatMoney, formatMoneyCompact, formatNumber } from '../../../shared/format/format';
import type { CountryPayStats, RoleCountryRow, SalaryDistribution } from '../data/insights.types';
import type { ChartColors } from './chart-colors';

const FONT = { family: "'Inter Variable', system-ui, sans-serif", size: 12 };

/** Hairline, recessive axes and grid; no legend (single series: the title names it). */
function axes(colors: ChartColors, valueAxis: 'x' | 'y', valueFormat: (v: number) => string) {
  const value = {
    beginAtZero: true,
    grid: { color: colors.grid, drawTicks: false },
    border: { color: colors.axis },
    ticks: { color: colors.muted, font: FONT, padding: 6, callback: (v: string | number) => valueFormat(Number(v)) },
  };
  const category = {
    grid: { display: false },
    border: { color: colors.axis },
    ticks: { color: colors.muted, font: FONT },
  };
  return valueAxis === 'x' ? { x: value, y: category } : { x: category, y: value };
}

function tooltip(colors: ChartColors) {
  return {
    backgroundColor: colors.surface,
    titleColor: colors.muted,
    bodyColor: colors.text,
    borderColor: colors.axis,
    borderWidth: 1,
    padding: 10,
    displayColors: false,
    titleFont: { ...FONT, weight: 400 as const },
    bodyFont: { ...FONT, size: 13 },
  };
}

/** Writes each bar's value just past its tip (selective direct labels for a single series). */
function valueAtTip(format: (v: number) => string, color: string): Plugin<'bar'> {
  return {
    id: 'valueAtTip',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      ctx.save();
      ctx.font = `12px ${FONT.family}`;
      ctx.fillStyle = color;
      ctx.textBaseline = 'middle';
      meta.data.forEach((bar, i) => {
        const value = chart.data.datasets[0]?.data[i] as number;
        const { x, y } = bar.getProps(['x', 'y'], true) as { x: number; y: number };
        ctx.fillText(format(value), x + 6, y);
      });
      ctx.restore();
    },
  };
}

/** Median salary by country in USD: magnitude, one hue, sorted, value at the tip. */
export function countryMedianConfig(countries: CountryPayStats[], colors: ChartColors): ChartConfiguration<'bar'> {
  const rows = [...countries].sort((a, b) => b.medianUsd - a.medianUsd);
  return {
    type: 'bar',
    data: {
      labels: rows.map((c) => c.countryName),
      datasets: [{
        data: rows.map((c) => c.medianUsd),
        backgroundColor: colors.series,
        maxBarThickness: 20,
        borderRadius: { topRight: 4, bottomRight: 4 },
        borderSkipped: 'start',
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: { right: 64 } },
      scales: axes(colors, 'x', (v) => formatMoneyCompact(v, 'USD')),
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltip(colors),
          callbacks: {
            title: (items: TooltipItem<'bar'>[]) => `${rows[items[0]!.dataIndex]!.countryName} · median salary`,
            label: (item: TooltipItem<'bar'>) => {
              const c = rows[item.dataIndex]!;
              return [formatMoney(c.medianUsd, 'USD'), `In local currency: ${formatMoney(c.median, c.currencyCode)}`, `People: ${formatNumber(c.headcount)}`];
            },
          },
        },
      },
    },
    plugins: [valueAtTip((v) => formatMoneyCompact(v, 'USD'), colors.text)],
  };
}

/** Salary histogram: touching columns, one hue, a 2px surface gap between them. */
export function distributionConfig(distribution: SalaryDistribution, colors: ChartColors): ChartConfiguration<'bar'> {
  const currency = distribution.currencyCode;
  return {
    type: 'bar',
    data: {
      labels: distribution.buckets.map((b) => formatMoneyCompact(b.lower, currency)),
      datasets: [{
        data: distribution.buckets.map((b) => b.count),
        backgroundColor: colors.series,
        borderColor: colors.surface,
        borderWidth: { left: 1, right: 1 },
        borderSkipped: 'bottom',
        borderRadius: { topLeft: 4, topRight: 4 },
        categoryPercentage: 1,
        barPercentage: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      scales: axes(colors, 'y', (v) => formatNumber(v)),
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltip(colors),
          callbacks: {
            title: (items: TooltipItem<'bar'>[]) => {
              const b = distribution.buckets[items[0]!.dataIndex]!;
              return `${formatMoney(b.lower, currency)} – ${formatMoney(b.upper, currency)}`;
            },
            label: (item: TooltipItem<'bar'>) => {
              const b = distribution.buckets[item.dataIndex]!;
              const share = distribution.headcount ? (b.count / distribution.headcount) * 100 : 0;
              return [`${formatNumber(b.count)} ${b.count === 1 ? 'person' : 'people'}`, `Share: ${share.toFixed(1)}%`];
            },
          },
        },
      },
    },
  };
}

/** One role across countries in USD: middle-50% band (lighter step) and median point. */
export function roleComparisonConfig(rows: RoleCountryRow[], colors: ChartColors): ChartConfiguration {
  const sorted = [...rows].sort((a, b) => b.medianUsd - a.medianUsd);
  return {
    type: 'bar',
    data: {
      labels: sorted.map((r) => r.countryName),
      datasets: [
        {
          type: 'bar',
          label: 'Middle 50%',
          data: sorted.map((r) => [r.p25Usd, r.p75Usd] as [number, number]),
          backgroundColor: colors.band,
          barThickness: 12,
          borderRadius: 4,
          borderSkipped: false,
          order: 1,
        },
        {
          type: 'line',
          label: 'Median',
          // Explicit points: a line dataset ignores the chart's indexAxis and would plot the value
          // on the category axis, off-screen.
          data: sorted.map((r, i) => ({ x: r.medianUsd, y: i })), // y: category index
          order: 0, // drawn last, on top of the band
          showLine: false,
          pointRadius: 6,
          pointHoverRadius: 7,
          pointBackgroundColor: colors.series,
          // 2px surface ring keeps the dot legible where it sits on the band.
          pointBorderColor: colors.surface,
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', axis: 'y', intersect: false },
      scales: axes(colors, 'x', (v) => formatMoneyCompact(v, 'USD')),
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltip(colors),
          filter: (item) => item.datasetIndex === 1,
          callbacks: {
            title: (items) => `${sorted[items[0]!.dataIndex]!.countryName} · median`,
            label: (item) => {
              const r = sorted[item.dataIndex]!;
              return [
                formatMoney(r.medianUsd, 'USD'),
                `Middle 50%: ${formatMoneyCompact(r.p25Usd, 'USD')} – ${formatMoneyCompact(r.p75Usd, 'USD')}`,
                `Median, local: ${formatMoney(r.medianLocal, r.currencyCode)}`,
                `People: ${formatNumber(r.headcount)}`,
              ];
            },
          },
        },
      },
    },
  };
}
