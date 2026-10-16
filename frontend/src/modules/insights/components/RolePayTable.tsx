import { Badge } from "@shared/components/ui/badge";
import { Table, TBody, Td, Th, THead, Tr } from "@shared/components/ui/table";
import { formatMoney, formatNumber } from "@shared/lib/format";
import { sharedScale, SMALL_GROUP } from "../lib/bands";
import type { RolePayStats } from "../types/insights.types";
import { PayBandTrack } from "./PayBandTrack";

/** "What do we pay each role here?" — the middle half of salaries per role, on one scale. */
export function RolePayTable({ roles, currency }: { roles: RolePayStats[]; currency: string }) {
  // Sorted by median, the bands read as a pay ladder rather than a list.
  const sorted = [...roles].sort((a, b) => a.median - b.median);
  const scale = sharedScale(sorted.map((r) => ({ low: r.p25, high: r.p75 })));
  return (
    <Table>
      <THead>
        <Tr>
          <Th>Role</Th>
          <Th className="text-right">People</Th>
          <Th className="hidden text-right sm:table-cell">25th pct</Th>
          <Th className="text-right">Median</Th>
          <Th className="hidden text-right sm:table-cell">75th pct</Th>
          <Th className="hidden w-1/4 sm:table-cell">Middle 50%</Th>
        </Tr>
      </THead>
      <TBody>
        {sorted.map((r) => (
          <Tr key={r.jobTitleId}>
            <Td>
              <span className="font-medium">{r.jobTitleName}</span>
              {r.headcount < SMALL_GROUP ? (
                <Badge tone="warning" className="ml-2" title="Too few people for the statistics to describe a pattern">
                  Small group
                </Badge>
              ) : null}
            </Td>
            <Td className="text-right tabular-nums">{formatNumber(r.headcount)}</Td>
            <Td className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">{formatMoney(r.p25, currency)}</Td>
            <Td className="text-right font-medium tabular-nums">{formatMoney(r.median, currency)}</Td>
            <Td className="hidden text-right tabular-nums text-muted-foreground sm:table-cell">{formatMoney(r.p75, currency)}</Td>
            <Td className="hidden sm:table-cell">{scale ? <PayBandTrack low={r.p25} median={r.median} high={r.p75} scale={scale} /> : null}</Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  );
}
