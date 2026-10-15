"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useReferenceData } from "@modules/reference/hooks/useReferenceData";
import { Button } from "@shared/components/ui/button";
import { Dialog } from "@shared/components/ui/dialog";
import { Field } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import { Select } from "@shared/components/ui/select";
import { todayIso } from "@shared/lib/dates";
import { applyServerErrors } from "@shared/lib/formErrors";
import { useCreateEmployee } from "../hooks/useEmployees";
import { createEmployeeSchema, type CreateEmployeeFormInput, type CreateEmployeeValues } from "../lib/schemas";
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType } from "../types/employee.types";
import { FormAlert } from "./FormAlert";

const FIELDS = ["fullName", "email", "countryCode", "departmentId", "jobTitleId", "employmentType", "hireDate", "salary"] as const;

export function CreateEmployeeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const today = todayIso();
  const { data: reference } = useReferenceData();
  const create = useCreateEmployee();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors }
  } = useForm<CreateEmployeeFormInput, unknown, CreateEmployeeValues>({
    resolver: zodResolver(createEmployeeSchema(today)),
    defaultValues: { employmentType: "FULL_TIME", hireDate: today }
  });

  const countryCode = useWatch({ control, name: "countryCode" });
  const currency = reference?.countries.find((c) => c.code === countryCode)?.currencyCode;

  const close = () => {
    reset();
    setFormError(null);
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    create.mutate(
      { ...values, salary: Number(values.salary) },
      {
        onSuccess: (employee) => {
          close();
          router.push(`/employees/${employee.id}`);
        },
        onError: (error) => setFormError(applyServerErrors(error, setError, FIELDS))
      }
    );
  });

  return (
    <Dialog open={open} onClose={close} title="Add employee" description="Their starting salary becomes the first entry in their salary history.">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Full name" error={errors.fullName?.message}>
            <Input autoComplete="off" {...register("fullName")} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Work email" error={errors.email?.message}>
            <Input type="email" autoComplete="off" {...register("email")} />
          </Field>
        </div>
        <Field label="Country" error={errors.countryCode?.message} hint="Sets the salary currency; cannot be changed later.">
          <Select {...register("countryCode")} defaultValue="">
            <option value="" disabled>Choose…</option>
            {reference?.countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name} ({c.currencyCode})</option>
            ))}
          </Select>
        </Field>
        <Field label="Employment type" error={errors.employmentType?.message}>
          <Select {...register("employmentType")}>
            {(Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]).map((type) => (
              <option key={type} value={type}>{EMPLOYMENT_TYPE_LABELS[type]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Department" error={errors.departmentId?.message}>
          <Select {...register("departmentId")} defaultValue="">
            <option value="" disabled>Choose…</option>
            {reference?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Job title" error={errors.jobTitleId?.message}>
          <Select {...register("jobTitleId")} defaultValue="">
            <option value="" disabled>Choose…</option>
            {reference?.jobTitles.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
        <Field label="Hire date" error={errors.hireDate?.message}>
          <Input type="date" max={today} {...register("hireDate")} />
        </Field>
        <Field label={`Annual salary${currency ? ` (${currency})` : ""}`} error={errors.salary?.message} hint="Full-time equivalent base pay.">
          <Input inputMode="decimal" autoComplete="off" {...register("salary")} />
        </Field>
        <div className="sm:col-span-2">
          <FormAlert message={formError} />
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" disabled={create.isPending}>{create.isPending ? "Saving…" : "Add employee"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
