import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { toApiError } from '../../../core/api/api-error';
import { applyServerErrors } from '../../../shared/forms/server-errors';
import { ReferenceService } from '../../reference/reference.service';
import { EmployeeApi } from '../data/employee.api';
import { EMPLOYMENT_TYPE_LABELS, type Employee, type EmploymentType } from '../data/employee.types';
import { email, firstError, maxLength, required, selected } from '../data/validators';
import type { DialogResult } from './change-salary.dialog';

/** Salary, country and hire date are deliberately absent (history integrity, currency). */
@Component({
  selector: 'app-edit-employee-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dialog.scss',
  template: `
    <h2 mat-dialog-title>Edit details</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <mat-dialog-content>
        <p class="hint">To change pay, use “Change salary” so it is recorded in the history.</p>
        <div class="form">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Full name</mat-label>
            <input matInput formControlName="fullName" />
            <mat-error>{{ error('fullName') }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Work email</mat-label>
            <input matInput type="email" formControlName="email" />
            <mat-error>{{ error('email') }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Department</mat-label>
            <mat-select formControlName="departmentId">
              @for (d of reference()?.departments ?? []; track d.id) {
                <mat-option [value]="d.id">{{ d.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Job title</mat-label>
            <mat-select formControlName="jobTitleId">
              @for (t of reference()?.jobTitles ?? []; track t.id) {
                <mat-option [value]="t.id">{{ t.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Employment type</mat-label>
            <mat-select formControlName="employmentType">
              @for (type of employmentTypes; track type) {
                <mat-option [value]="type">{{ labels[type] }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
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
        <button mat-flat-button type="submit" [disabled]="pending()">{{ pending() ? 'Saving…' : 'Save changes' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class EditEmployeeDialog {
  readonly employee = inject<Employee>(MAT_DIALOG_DATA);
  readonly ref = inject(MatDialogRef<EditEmployeeDialog, DialogResult>);
  private readonly api = inject(EmployeeApi);
  readonly reference = inject(ReferenceService).data;

  readonly labels = EMPLOYMENT_TYPE_LABELS;
  readonly employmentTypes = Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[];
  readonly pending = signal(false);
  readonly formError = signal<string | null>(null);
  readonly conflict = signal(false);

  readonly form = inject(NonNullableFormBuilder).group({
    fullName: [this.employee.fullName, [required('Enter a name'), maxLength(200, 'Keep it under 200 characters')]],
    email: [this.employee.email, [required('Enter an email'), email]],
    departmentId: [this.employee.departmentId, [selected('department')]],
    jobTitleId: [this.employee.jobTitleId, [selected('job title')]],
    employmentType: [this.employee.employmentType],
  });

  error(name: keyof typeof this.form.controls): string | null {
    return firstError(this.form.controls[name]);
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.pending.set(true);
    this.formError.set(null);
    const v = this.form.getRawValue();
    try {
      await this.api.update(this.employee.id, {
        version: this.employee.version, fullName: v.fullName.trim(), email: v.email.trim(),
        departmentId: v.departmentId, jobTitleId: v.jobTitleId, employmentType: v.employmentType,
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
