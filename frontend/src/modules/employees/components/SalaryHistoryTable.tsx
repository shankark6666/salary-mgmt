import { Table, TBody, Td, Th, THead, Tr } from "@shared/components/ui/table";
import { formatDate, formatMoney, formatPercent } from "@shared/lib/format";
import { cn } from "@shared/utils/cn";
import type { SalaryHistoryEntry } from "../types/employee.types";

/** Newest first: the question is usually "what happened most recently, and why?" */
export function SalaryHistoryTable({ entries, currency }: { entries: SalaryHistoryEntry[]; currency: string }) {
  const newestFirst = [...entries].reverse();
  return (
    <Table>
      <THead>
        <Tr>
          <Th>Effective</Th>
          <Th className="text-right">Salary</Th>
          <Th className="text-right">Change</Th>
          <Th>Reason</Th>
          <Th>Recorded by</Th>
        </Tr>
      </THead>
      <TBody>
        {newestFirst.map((entry) => {
          const delta =
            entry.previousSalary === null ? null : ((entry.newSalary - entry.previousSalary) / entry.previousSalary) * 100;
          return (
            <Tr key={entry.id}>
              <Td className="whitespace-nowrap">{formatDate(entry.effectiveDate)}</Td>
              <Td className="text-right font-medium tabular-nums">{formatMoney(entry.newSalary, currency)}</Td>
              <Td className={cn("text-right tabular-nums", delta !== null && (delta >= 0 ? "text-success" : "text-destructive"))}>
                {delta === null ? "—" : formatPercent(delta)}
              </Td>
              <Td>{entry.reason}</Td>
              <Td className="text-muted-foreground">{entry.changedBy}</Td>
            </Tr>
          );
        })}
      </TBody>
    </Table>
  );
}
