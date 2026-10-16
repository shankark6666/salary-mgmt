import { Card } from "@shared/components/ui/card";

/** Label · value · detail. Large figures use proportional digits (tabular only in columns). */
export function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-2xl font-semibold [font-feature-settings:normal] sm:text-3xl">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </Card>
  );
}
