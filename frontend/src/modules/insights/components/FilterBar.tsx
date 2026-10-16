import type { ReactNode } from "react";

/** One row of filters above everything it scopes (never inside a chart card). */
export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="mb-4 flex flex-wrap items-end gap-3">{children}</div>;
}
