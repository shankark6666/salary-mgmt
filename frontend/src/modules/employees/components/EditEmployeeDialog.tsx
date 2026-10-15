"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toApiError } from "@shared/api/errors";
import { useReferenceData } from "@modules/reference/hooks/useReferenceData";
import { Button } from "@shared/components/ui/button";
import { Dialog } from "@shared/components/ui/dialog";
import { Field } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import { Select } from "@shared/components/ui/select";
import { applyServerErrors } from "@shared/lib/formErrors";
import { useUpdateEmployee } from "../hooks/useEmployees";
import { updateEmployeeSchema, type UpdateEmployeeValues } from "../lib/schemas";
import { EMPLOYMENT_TYPE_LABELS, type Employee, type EmploymentType } from "../types/employee.types";
import { FormAlert } from "./FormAlert";

const FIELDS = ["fullName", "email", "departmentId", "jobTitleId", "employmentType"] as const;

interface Props {
  employee: Employee;
  open: boolean;
  onClose: () => void;
  onReload: () => void;
}

/** Salary, country and hire date are deliberately absent: see the domain rules (ADR in REQUIREMENTS). */
export function EditEmployeeDialog({ employee, open, onClose, onReload }: Props) {
  const { data: reference } = useReferenceData();
  const update = useUpdateEmployee(employee.id);
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<UpdateEmployeeValues>({
    resolver: zodResolver(updateEmployeeSchema),
    values: {
      fullName: employee.fullName,
      email: employee.email,
      departmentId: employee.departmentId,
      jobTitleId: employee.jobTitleId,
      employmentType: employee.employmentType
    }
  });

  const close = () => {
    setFormError(null);
    setConflict(false);
    onClose();
  };

  const onSubmit = handleSubmit((values) => {
    setFormError(null);
    update.mutate(
      { ...values, version: employee.version },
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
    <Dialog open={open} onClose={close} title="Edit details" description="To change pay, use “Change salary” so it is recorded in the history.">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Full name" error={errors.fullName?.message}>
            <Input {...register("fullName")} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Work email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </Field>
        </div>
        <Field label="Department" error={errors.departmentId?.message}>
          <Select {...register("departmentId")}>
            {reference?.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Job title" error={errors.jobTitleId?.message}>
          <Select {...register("jobTitleId")}>
            {reference?.jobTitles.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
        <Field label="Employment type" error={errors.employmentType?.message}>
          <Select {...register("employmentType")}>
            {(Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]).map((type) => (
              <option key={type} value={type}>{EMPLOYMENT_TYPE_LABELS[type]}</option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <FormAlert message={formError} conflict={conflict} onReload={() => { close(); onReload(); }} />
        </div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <Button variant="secondary" onClick={close}>Cancel</Button>
          <Button type="submit" disabled={update.isPending}>{update.isPending ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>
    </Dialog>
  );
}
