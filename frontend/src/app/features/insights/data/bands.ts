/**
 * Geometry for inline pay bands (p25–p75 with a median tick) drawn in table rows. Every row in
 * a table shares one scale, so bands are comparable down the column.
 */
export interface BandScale {
  min: number;
  max: number;
}

/** Breathing room at both ends so the outermost marks are never clipped by the track edge. */
const PADDING = 0.04;

export function sharedScale(rows: { low: number; high: number }[]): BandScale | null {
  if (rows.length === 0) return null;
  const low = Math.min(...rows.map((r) => r.low));
  const high = Math.max(...rows.map((r) => r.high));
  const pad = high === low ? 1 : (high - low) * PADDING;
  return { min: low - pad, max: high + pad };
}

/** Position on the shared scale as a percentage of the track, clamped to [0, 100]. */
export function toPercent(value: number, scale: BandScale) {
  const pct = ((value - scale.min) / (scale.max - scale.min)) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Deviation bars grow from a centre line; the half-width is the larger of the threshold-relevant
 * extreme on the page, so the longest bar fills its half and the rest stay proportional.
 */
export function deviationWidth(deviation: number, maxAbs: number) {
  if (maxAbs <= 0) return 0;
  return Math.min(50, (Math.abs(deviation) / maxAbs) * 50);
}

/** Below this many people a statistic is one or two individuals' pay, not a pattern. */
export const SMALL_GROUP = 5;
