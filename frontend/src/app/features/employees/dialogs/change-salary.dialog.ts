import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { toApiError } from '../../../core/api/api-error';
import { TODAY } from '../../../core/time/today';
import { formatDate, formatMoney, formatPercent } from '../../../shared/format/format';
import { applyServerErrors } from '../../../shared/forms/server-errors';
import { EmployeeApi } from '../data/employee.api';
import type { Employee } from '../data/employee.types';
import {
  firstError, LARGE_CHANGE_PERCENT, maxLength, minTrimmedLength, money, notAfter, notBefore, notCurrentSalary,
  percentChange, required,
} from '../data/validators';

export interface ChangeSalaryData {
  employee: Employee;
  latestChangeDate: string;
}

/** Result: 'saved' after a change, 'reload' when someone else changed the employee first. */
export type DialogResult = 'saved' | 'reload' | undefined;

@Component({
  selector: 'app-change-salary-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dialog.scss',
  template: `
    <h2 mat-dialog-title>Change salary</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <mat-dialog-content>
        <p class="hint">Current: {{ current }} a year.</p>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>New annual salary ({{ data.employee.currencyCode }})</mat-label>
          <input matInput inputmode="decimal" formControlName="newSalary" autocomplete="off" cdkFocusInitial />
          <mat-error>{{ error('newSalary') }}</mat-error>
        </mat-form-field>
        @if (delta(); as d) {
          <div aria-live="polite">
            <p class="delta" [class.up]="d > 0" [class.down]="d < 0">{{ percent(d) }} vs current salary</p>
            @if (large()) {
              <p class="warning">That is a large change. Check the amount — an extra or missing zero is easy to miss.</p>
            }
          </div>
        }
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Effective date</mat-label>
          <input matInput type="date" formControlName="effectiveDate" [min]="data.latestChangeDate" [max]="today" />
          <mat-hint>Between {{ earliest }} and today.</mat-hint>
          <mat-error>{{ error('effectiveDate') }}</mat-error>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Reason</mat-label>
          <textarea matInput formControlName="reason" rows="3" maxlength="500"></textarea>
          <mat-error>{{ error('reason') }}</mat-error>
        </mat-form-field>
        <div class="reasons" role="group" aria-label="Common reasons">
          @for (reason of commonReasons; track reason) {
            <button mat-stroked-button type="button" (click)="useReason(reason)">{{ reason }}</button>
          }
        </div>
        @if (formError()) {
          <div class="alert" role="alert">
            <span>{{ formError() }}</span>
            @if (conflict()) {
              <button mat-stroked-button type="button" (click)="ref.close('reload')">Reload</button>
            }
          </div>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit" [disabled]="pending()">{{ pending() ? 'Saving…' : 'Record change' }}</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `.full-width { width: 100%; } .hint { margin-top: 0; }`,
})
export class ChangeSalaryDialog {
  readonly data = inject<ChangeSalaryData>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<ChangeSalaryDialog, DialogResult>);
  private readonly api = inject(EmployeeApi);

  readonly today = inject(TODAY)();
  readonly current = formatMoney(this.data.employee.salary, this.data.employee.currencyCode);
  readonly earliest = formatDate(this.data.latestChangeDate);
  readonly commonReasons = ['Annual review', 'Promotion', 'Market adjustment', 'Role change'];
  readonly pending = signal(false);
  readonly formError = signal<string | null>(null);
  readonly conflict = signal(false);

  readonly form = inject(NonNullableFormBuilder).group({
    newSalary: ['', [money, notCurrentSalary(this.data.employee.salary)]],
    effectiveDate: [this.today, [required('Enter the effective date'), notAfter(this.today, 'Cannot be in the future'), notBefore(this.data.latestChangeDate)]],
    reason: ['', [minTrimmedLength(3, 'Say why the salary is changing'), maxLength(500, 'Keep it under 500 characters')]],
  });

  private readonly newSalary = toSignal(this.form.controls.newSalary.valueChanges, { initialValue: '' });
  readonly delta = computed(() => {
    const d = percentChange(this.data.employee.salary, this.newSalary());
    return d === null || d === 0 ? null : d;
  });
  readonly large = computed(() => Math.abs(this.delta() ?? 0) >= LARGE_CHANGE_PERCENT);

  percent(value: number): string {
    return formatPercent(value);
  }

  error(name: keyof typeof this.form.controls): string | null {
    return firstError(this.form.controls[name]);
  }

  useReason(reason: string): void {
    this.form.controls.reason.setValue(reason);
    this.form.controls.reason.markAsTouched();
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.pending.set(true);
    this.formError.set(null);
    this.conflict.set(false);
    const v = this.form.getRawValue();
    try {
      await this.api.changeSalary(this.data.employee.id, {
        version: this.data.employee.version, newSalary: Number(v.newSalary),
        effectiveDate: v.effectiveDate, reason: v.reason.trim(),
      });
      this.ref.close('saved');
    } catch (error) {
      this.conflict.set(toApiError(error).isConflict);
      this.formError.set(applyServerErrors(error, this.form));
    } finally {
      this.pending.set(false);
    }
  }
}
