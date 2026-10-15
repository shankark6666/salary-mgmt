import { z } from "zod";
import { formatDate } from "@shared/lib/format";

const MONEY = /^\d{1,12}(\.\d{1,2})?$/;

export const moneyField = z
  .string()
  .trim()
  .min(1, "Enter an amount")
  .regex(MONEY, "Use digits with up to 2 decimals, e.g. 85000 or 85000.50")
  .refine((value) => Number(value) > 0, "Must be greater than zero");

const employmentType = z.enum(["FULL_TIME", "PART_TIME", "CONTRACTOR"]);
const selectedId = (label: string) =>
  z.coerce.number({ error: `Choose a ${label}` }).int().positive(`Choose a ${label}`);

const details = {
  fullName: z.string().trim().min(1, "Enter a name").max(200, "Keep it under 200 characters"),
  email: z.string().trim().min(1, "Enter an email").email("Enter a valid email").max(254),
  departmentId: selectedId("department"),
  jobTitleId: selectedId("job title"),
  employmentType
};

export function createEmployeeSchema(today: string) {
  return z.object({
    ...details,
    countryCode: z.string().regex(/^[A-Z]{2}$/, "Choose a country"),
    hireDate: z
      .string()
      .min(1, "Enter the hire date")
      .refine((date) => date <= today, "Hire date cannot be in the future"),
    salary: moneyField
  });
}

export const updateEmployeeSchema = z.object(details);

interface SalaryContext {
  currentSalary: number;
  earliestDate: string;
  today: string;
}

/** Mirrors the domain rules in Employee.changeSalary, so most mistakes never reach the server. */
export function changeSalarySchema({ currentSalary, earliestDate, today }: SalaryContext) {
  return z.object({
    newSalary: moneyField.refine(
      (value) => Number(value) !== currentSalary,
      "That is the current salary"
    ),
    effectiveDate: z
      .string()
      .min(1, "Enter the effective date")
      .refine((date) => date <= today, "Cannot be in the future")
      .refine((date) => date >= earliestDate, `Cannot be before the latest change (${formatDate(earliestDate)})`),
    reason: z.string().trim().min(3, "Say why the salary is changing").max(500)
  });
}

// Forms hold raw input (select values are strings until coerced); submit handlers receive the
// validated output. react-hook-form is typed with both.
export type CreateEmployeeFormInput = z.input<ReturnType<typeof createEmployeeSchema>>;
export type CreateEmployeeValues = z.output<ReturnType<typeof createEmployeeSchema>>;
export type UpdateEmployeeFormInput = z.input<typeof updateEmployeeSchema>;
export type UpdateEmployeeValues = z.output<typeof updateEmployeeSchema>;
export type ChangeSalaryValues = z.output<ReturnType<typeof changeSalarySchema>>;

/**
 * Changes this large are usually a typo (a zero too many or too few), so the form asks the user
 * to double-check rather than blocking: genuine large changes do happen.
 */
export const LARGE_CHANGE_PERCENT = 25;

/** Percentage change for the live preview; null until the input is a valid amount. */
export function percentChange(from: number, to: string) {
  if (!MONEY.test(to.trim()) || from <= 0) return null;
  return ((Number(to) - from) / from) * 100;
}
