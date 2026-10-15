"use client";

import { ArrowLeft, Pencil, UserX, Wallet } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { canWrite } from "@modules/auth/types/auth.types";
import { useCurrentUser } from "@modules/auth/hooks/useCurrentUser";
import { useReferenceData } from "@modules/reference/hooks/useReferenceData";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { PageHeader } from "@shared/components/layout/PageHeader";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";
import { Skeleton } from "@shared/components/ui/skeleton";
import { formatDate, formatMoney } from "@shared/lib/format";
import { useEmployee, useSalaryHistory } from "../hooks/useEmployees";
import { EMPLOYMENT_TYPE_LABELS } from "../types/employee.types";
import { ChangeSalaryDialog } from "./ChangeSalaryDialog";
import { DeactivateDialog } from "./DeactivateDialog";
import { EditEmployeeDialog } from "./EditEmployeeDialog";
import { SalaryHistoryTable } from "./SalaryHistoryTable";

type OpenDialog = "edit" | "salary" | "deactivate" | null;

export function EmployeeDetail({ id }: { id: number }) {
  const employee = useEmployee(id);
  const history = useSalaryHistory(id);
  const { data: user } = useCurrentUser();
  const { data: reference } = useReferenceData();
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const back = (
    <Link href="/employees" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-4 w-4" aria-hidden />
      Employees
    </Link>
  );

  if (employee.isError) {
    return (
      <>
        {back}
        <ErrorState
          message={employee.error.status === 404 ? "This employee does not exist." : employee.error.message}
          {...(employee.error.status === 404 ? {} : { onRetry: () => employee.refetch() })}
        />
      </>
    );
  }
  if (!employee.data) {
    return (
      <div aria-busy="true" className="space-y-4">
        {back}
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const e = employee.data;
  const editable = canWrite(user) && e.active;
  const latestChangeDate = history.data?.at(-1)?.effectiveDate ?? e.hireDate;
  const reload = () => {
    void employee.refetch();
    void history.refetch();
  };

  return (
    <>
      {back}
      <PageHeader
        title={e.fullName}
        description={`${e.employeeCode} · ${e.jobTitleName}, ${e.departmentName}`}
        actions={
          editable ? (
            <>
              <Button variant="secondary" onClick={() => setDialog("edit")}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit details
              </Button>
              <Button onClick={() => setDialog("salary")} disabled={!history.data}>
                <Wallet className="h-4 w-4" aria-hidden />
                Change salary
              </Button>
              <Button variant="ghost" onClick={() => setDialog("deactivate")}>
                <UserX className="h-4 w-4" aria-hidden />
                Deactivate
              </Button>
            </>
          ) : null
        }
      />
      {!e.active ? (
        <p className="mb-4 rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Inactive employee — the record is read-only and excluded from insights.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Annual salary</CardDescription>
            <p className="text-3xl font-semibold tabular-nums">{formatMoney(e.salary, e.currencyCode)}</p>
            {e.currencyCode !== "USD" ? (
              <p className="text-sm text-muted-foreground">
                ≈ {formatMoney(e.salaryUsd, "USD")}
                {reference ? ` at reference rates of ${formatDate(reference.fxRatesAsOf)}` : ""}
              </p>
            ) : null}
          </CardHeader>
        </Card>
        <Card className="lg:col-span-2">
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-3">
            <Detail label="Status">
              <Badge tone={e.active ? "success" : "neutral"}>{e.active ? "Active" : "Inactive"}</Badge>
            </Detail>
            <Detail label="Email">{e.email}</Detail>
            <Detail label="Country">{e.countryName} ({e.currencyCode})</Detail>
            <Detail label="Department">{e.departmentName}</Detail>
            <Detail label="Employment">{EMPLOYMENT_TYPE_LABELS[e.employmentType]}</Detail>
            <Detail label="Hired">{formatDate(e.hireDate)}</Detail>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Salary history</CardTitle>
          <CardDescription>Every change, who recorded it and why. History is never edited.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.isError ? (
            <ErrorState message={history.error.message} onRetry={() => history.refetch()} />
          ) : history.data ? (
            <SalaryHistoryTable entries={history.data} currency={e.currencyCode} />
          ) : (
            <Skeleton className="h-32 w-full" />
          )}
        </CardContent>
      </Card>

      {editable ? (
        <>
          <EditEmployeeDialog employee={e} open={dialog === "edit"} onClose={() => setDialog(null)} onReload={reload} />
          <ChangeSalaryDialog
            employee={e}
            latestChangeDate={latestChangeDate}
            open={dialog === "salary"}
            onClose={() => setDialog(null)}
            onReload={reload}
          />
          <DeactivateDialog employee={e} open={dialog === "deactivate"} onClose={() => setDialog(null)} />
        </>
      ) : null}
    </>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
