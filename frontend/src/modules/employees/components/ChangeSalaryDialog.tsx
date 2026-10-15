"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toApiError } from "@shared/api/errors";
import { Button } from "@shared/components/ui/button";
import { Dialog } from "@shared/components/ui/dialog";
import { Field } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import { Textarea } from "@shared/components/ui/textarea";
import { todayIso } from "@shared/lib/dates";
import { formatDate, formatMoney, formatPercent } from "@shared/lib/format";
import { applyServerErrors } from "@shared/lib/formErrors";
import { cn } from "@shared/utils/cn";
import { useChangeSalary } from "../hooks/useEmployees";
import { changeSalarySchema, LARGE_CHANGE_PERCENT, percentChange, type ChangeSalaryValues } from "../lib/schemas";
import type { Employee } from "../types/employee.types";
import { FormAlert } from "./FormAlert";

const FIELDS = ["newSalary", "effectiveDate", "reason"] as const;
const COMMON_REASONS = ["Annual review", "Promotion", "Market adjustment", "Role change"];

interface Props {
  employee: Employee;
  latestChangeDate: string;
  open: boolean;
  onClose: () => void;
  onReload: () => void;
}

export function ChangeSalaryDialog({ employee, latestChangeDate, open, onClose, onReload }: Props) {
  const today = todayIso();
  const change = useChangeSalary(employee.id);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors }
  } = useForm<ChangeSalaryValues>({
    resolver: zodResolver(changeSalarySchema({ currentSalary: employee.salary, earliestDate: latestChangeDate, today })),
    defaultValues: { newSalary: "", effectiveDate: today, reason: "" }
  });

  const delta = percentChange(employee.salary, watch("newSalary") ?? "");

  const close = () => {
    reset();
    setFormError(null);
    setConflict(false);
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    change.mutate(
      { version: employee.version, newSalary: Number(values.newSalary), effectiveDate: values.effectiveDate, reason: values.reason },
      {
        onSuccess: close,
        onError: (error) => {
          setConflict(toApiError(error).isConflict);
          setFormError(applyServerErrors(error, setError, FIELDS));
        }
      }
    );
  });

  return (
    <Dialog open={open} onClose={close} title="Change salary" description={`Current: ${formatMoney(employee.salary, employee.currencyCode)} a year.`}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <Field label={`New annual salary (${employee.currencyCode})`} error={errors.newSalary?.message}>
          <Input inputMode="decimal" autoComplete="off" autoFocus {...register("newSalary")} />
        </Field>
        {delta !== null && delta !== 0 ? (
          <div aria-live="polite" className="space-y-1">
            <p className={cn("text-sm font-medium", delta > 0 ? "text-success" : "text-destructive")}>
              {formatPercent(delta)} vs current salary
            </p>
            {Math.abs(delta) >= LARGE_CHANGE_PERCENT ? (
              <p className="rounded-md bg-warning-muted px-3 py-2 text-sm text-warning-muted-foreground">
                That is a large change. Check the amount — an extra or missing zero is easy to miss.
              </p>
            ) : null}
          </div>
        ) : null}
        <Field label="Effective date" error={errors.effectiveDate?.message} hint={`Between ${formatDate(latestChangeDate)} and today.`}>
          <Input type="date" min={latestChangeDate} max={today} {...register("effectiveDate")} />
        </Field>
        <Field label="Reason" error={errors.reason?.message}>
          <Textarea maxLength={500} {...register("reason")} />
        </Field>
        <div className="flex flex-wrap gap-2" aria-label="Common reasons">
          {COMMON_REASONS.map((reason) => (
            <Button key={reason} variant="secondary" size="sm" onClick={() => setValue("reason", reason, { shouldValidate: true })}>
              {reason}
            </Button>
          ))}
        </div>
        <FormAlert message={formError} conflict={conflict} onReload={() => { close(); onReload(); }} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" disabled={change.isPending}>{change.isPending ? "Saving…" : "Record change"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
