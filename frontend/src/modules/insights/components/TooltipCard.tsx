import type { ReactNode } from "react";

/** Chart tooltip body: the value leads, labels follow (the reader already knows the series). */
export function TooltipCard({ title, value, rows }: { title: string; value: ReactNode; rows?: [string, ReactNode][] }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="text-base font-semibold">{value}</p>
      <p className="text-muted-foreground">{title}</p>
      {rows?.length ? (
        <dl className="mt-1.5 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5 text-xs">
          {rows.map(([label, detail]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right tabular-nums">{detail}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
