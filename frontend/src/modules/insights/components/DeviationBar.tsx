import { deviationWidth } from "../lib/bands";

/**
 * Diverging bar from a centre line: below the peer median grows left in the cool pole, above
 * grows right in the warm pole. Polarity is also carried by direction and the signed number
 * beside it, so colour is never the only cue.
 */
export function DeviationBar({ deviation, maxAbs }: { deviation: number; maxAbs: number }) {
  const width = deviationWidth(deviation, maxAbs);
  const above = deviation > 0;
  return (
    <div aria-hidden className="relative h-3 w-full min-w-28">
      <div className="absolute inset-y-0 left-1/2 w-px bg-[var(--chart-axis)]" />
      <div
        className={above ? "absolute inset-y-0 left-1/2 rounded-r-sm bg-[var(--chart-above)]" : "absolute inset-y-0 right-1/2 rounded-l-sm bg-[var(--chart-below)]"}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
