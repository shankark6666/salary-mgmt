import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import { Badge } from "@shared/components/ui/badge";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Table, TBody, Td, Th, THead, Tr } from "@shared/components/ui/table";
import { formatDate, formatMoney } from "@shared/lib/format";
import { cn } from "@shared/utils/cn";
import type { Employee, SortDirection, SortField } from "../types/employee.types";

interface Props {
  employees: Employee[] | undefined;
  loading: boolean;
  sort: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  showStatus: boolean;
}

const COLUMNS: { field: SortField; label: string; align?: "right" }[] = [
  { field: "name", label: "Employee" },
  { field: "country", label: "Country" },
  { field: "department", label: "Department" },
  { field: "jobTitle", label: "Job title" },
  { field: "salaryUsd", label: "Salary", align: "right" },
  { field: "hireDate", label: "Hired" }
];

export function EmployeeTable({ employees, loading, sort, direction, onSort, showStatus }: Props) {
  return (
    <Table aria-busy={loading}>
      <THead>
        <Tr>
          {COLUMNS.map(({ field, label, align }) => {
            const active = sort === field;
            const Icon = !active ? ArrowUpDown : direction === "ASC" ? ArrowUp : ArrowDown;
            return (
              <Th
                key={field}
                aria-sort={active ? (direction === "ASC" ? "ascending" : "descending") : "none"}
                className={cn(align === "right" && "text-right")}
              >
                <button
                  type="button"
                  onClick={() => onSort(field)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-sm uppercase hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                    active && "text-foreground"
                  )}
                >
                  {label}
                  <Icon className="h-3 w-3" aria-hidden />
                  {field === "salaryUsd" ? <span className="sr-only">(compared in US dollars)</span> : null}
                </button>
              </Th>
            );
          })}
          {showStatus ? <Th>Status</Th> : null}
        </Tr>
      </THead>
      <TBody>
        {loading && !employees
          ? Array.from({ length: 8 }, (_, i) => (
              <Tr key={i}>
                {COLUMNS.map(({ field }) => (
                  <Td key={field}>
                    <Skeleton className="h-4 w-24" />
                  </Td>
                ))}
              </Tr>
            ))
          : employees?.map((employee) => (
              <Tr key={employee.id} className="hover:bg-muted">
                <Td>
                  {/* No prefetch: 25 rows would mean 25 speculative requests per page, mostly unused. */}
                  <Link href={`/employees/${employee.id}`} prefetch={false} className="font-medium hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring">
                    {employee.fullName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {employee.employeeCode} · {employee.email}
                  </p>
                </Td>
                <Td>{employee.countryName}</Td>
                <Td>{employee.departmentName}</Td>
                <Td>{employee.jobTitleName}</Td>
                <Td className="text-right tabular-nums">
                  <span className="font-medium">{formatMoney(employee.salary, employee.currencyCode)}</span>
                  {employee.currencyCode !== "USD" ? (
                    <p className="text-xs text-muted-foreground">≈ {formatMoney(employee.salaryUsd, "USD")}</p>
                  ) : null}
                </Td>
                <Td className="whitespace-nowrap">{formatDate(employee.hireDate)}</Td>
                {showStatus ? (
                  <Td>
                    <Badge tone={employee.active ? "success" : "neutral"}>{employee.active ? "Active" : "Inactive"}</Badge>
                  </Td>
                ) : null}
              </Tr>
            ))}
      </TBody>
    </Table>
  );
}
