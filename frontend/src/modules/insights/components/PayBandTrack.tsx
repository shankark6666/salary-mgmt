import { toPercent, type BandScale } from "../lib/bands";

/**
 * Inline p25–p75 band with a median tick on a scale shared by every row. Decorative for screen
 * readers: the same three numbers sit in the row's own cells.
 */
export function PayBandTrack({ low, median, high, scale }: { low: number; median: number; high: number; scale: BandScale }) {
  const left = toPercent(low, scale);
  const right = toPercent(high, scale);
  const mid = toPercent(median, scale);
  return (
    <div aria-hidden className="relative h-4 w-full min-w-32">
      <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[var(--chart-grid)]" />
      <div
        className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-sm bg-[var(--chart-band)]"
        style={{ left: `${left}%`, width: `${Math.max(right - left, 0.8)}%` }}
      />
      <div
        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-card)] bg-[var(--chart-series-1)]"
        style={{ left: `${mid}%` }}
      />
    </div>
  );
}
