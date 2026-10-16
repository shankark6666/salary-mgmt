import Link from "next/link";
import { Table, TBody, Td, Th, THead, Tr } from "@shared/components/ui/table";
import { formatMoney, formatNumber } from "@shared/lib/format";
import type { CountryPayStats } from "../types/insights.types";

/** The table twin of the country chart, plus the local-currency detail the chart leaves out. */
export function CountryPayTable({ countries }: { countries: CountryPayStats[] }) {
  return (
    <Table>
      <THead>
        <Tr>
          <Th>Country</Th>
          <Th className="text-right">People</Th>
          <Th className="text-right">Median (local)</Th>
          <Th className="hidden text-right md:table-cell">Range (local)</Th>
          <Th className="text-right">Median (USD)</Th>
          <Th className="hidden text-right sm:table-cell">Payroll (USD)</Th>
        </Tr>
      </THead>
      <TBody>
        {countries.map((c) => (
          <Tr key={c.countryCode}>
            <Td>
              <Link href={`/insights/countries?country=${c.countryCode}`} className="font-medium hover:underline">
                {c.countryName}
              </Link>
            </Td>
            <Td className="text-right tabular-nums">{formatNumber(c.headcount)}</Td>
            <Td className="text-right tabular-nums">{formatMoney(c.median, c.currencyCode)}</Td>
            <Td className="hidden whitespace-nowrap text-right tabular-nums text-muted-foreground md:table-cell">
              {formatMoney(c.min, c.currencyCode)} – {formatMoney(c.max, c.currencyCode)}
            </Td>
            <Td className="text-right tabular-nums">{formatMoney(c.medianUsd, "USD")}</Td>
            <Td className="hidden text-right tabular-nums sm:table-cell">{formatMoney(c.payrollUsd, "USD")}</Td>
          </Tr>
        ))}
      </TBody>
    </Table>
  );
}
