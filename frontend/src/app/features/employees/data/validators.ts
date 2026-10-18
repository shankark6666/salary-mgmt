import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { formatDate } from '../../../shared/format/format';

/**
 * Form rules mirroring the domain rules in the backend (Employee.hire / changeSalary), so most
 * mistakes are caught before a request is sent. Each validator returns its user-facing message
 * under its own key; `firstError` picks the one to show. The server still has the final say.
 */
const MONEY = /^\d{1,12}(\.\d{1,2})?$/;

/** Changes this large are usually a typo (a zero too many or too few): warn, don't block. */
export const LARGE_CHANGE_PERCENT = 25;

interface Message {
  message: string;
}

function fail(key: string, message: string): ValidationErrors {
  return { [key]: { message } satisfies Message };
}

const text = (control: AbstractControl): string => String(control.value ?? '').trim();

export const required = (message: string): ValidatorFn => (control) =>
  text(control) ? null : fail('required', message);

export const maxLength = (max: number, message: string): ValidatorFn => (control) =>
  text(control).length <= max ? null : fail('maxlength', message);

/** Same shape the backend accepts: local@domain.tld, no spaces. */
export const email: ValidatorFn = (control) =>
  !text(control) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(control))
    ? null
    : fail('email', 'Enter a valid email');

export const money: ValidatorFn = (control) => {
  const value = text(control);
  if (!value) return fail('required', 'Enter an amount');
  if (!MONEY.test(value)) return fail('money', 'Use digits with up to 2 decimals, e.g. 85000 or 85000.50');
  return Number(value) > 0 ? null : fail('positive', 'Must be greater than zero');
};

export const notCurrentSalary = (current: number): ValidatorFn => (control) =>
  MONEY.test(text(control)) && Number(text(control)) === current
    ? fail('unchanged', 'That is the current salary')
    : null;

export const notAfter = (latest: string, message: string): ValidatorFn => (control) =>
  text(control) && text(control) > latest ? fail('notAfter', message) : null;

export const notBefore = (earliest: string): ValidatorFn => (control) =>
  text(control) && text(control) < earliest
    ? fail('notBefore', `Cannot be before the latest change (${formatDate(earliest)})`)
    : null;

export const minTrimmedLength = (min: number, message: string): ValidatorFn => (control) =>
  text(control).length >= min ? null : fail('minlength', message);

export const selected = (label: string): ValidatorFn => (control) => {
  const id = Number(control.value);
  return Number.isInteger(id) && id > 0 ? null : fail('selected', `Choose a ${label}`);
};

/** The message to show for a control: its first error, once the user has interacted with it. */
export function firstError(control: AbstractControl | null): string | null {
  if (!control?.errors || !(control.touched || control.dirty)) return null;
  const first = Object.values(control.errors)[0] as Partial<Message> | undefined;
  return first?.message ?? null;
}

/** Percentage change for the live preview; null until the input is a valid amount. */
export function percentChange(from: number, to: string): number | null {
  if (!MONEY.test(to.trim()) || from <= 0) return null;
  return ((Number(to) - from) / from) * 100;
}
