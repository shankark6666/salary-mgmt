import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { TODAY } from '../../../core/time/today';
import { applyServerErrors } from '../../../shared/forms/server-errors';
import { ReferenceService } from '../../reference/reference.service';
import { EmployeeApi } from '../data/employee.api';
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType } from '../data/employee.types';
import { email, firstError, maxLength, money, notAfter, required, selected } from '../data/validators';

@Component({
  selector: 'app-create-employee-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dialog.scss',
  template: `
    <h2 mat-dialog-title>Add employee</h2>
    <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <mat-dialog-content>
        <p class="hint">Their starting salary becomes the first entry in their salary history.</p>
        <div class="form">
          <mat-form-field appearance="outline" class="full">
            <mat-label>Full name</mat-label>
            <input matInput formControlName="fullName" autocomplete="off" />
            <mat-error>{{ error('fullName') }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="full">
            <mat-label>Work email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="off" />
            <mat-error>{{ error('email') }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Country</mat-label>
            <mat-select formControlName="countryCode">
              @for (c of reference()?.countries ?? []; track c.code) {
                <mat-option [value]="c.code">{{ c.name }} ({{ c.currencyCode }})</mat-option>
              }
            </mat-select>
            <mat-hint>Sets the salary currency; cannot be changed later.</mat-hint>
            <mat-error>{{ error('countryCode') }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Employment type</mat-label>
            <mat-select formControlName="employmentType">
              @for (type of employmentTypes; track type) {
                <mat-option [value]="type">{{ labels[type] }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Department</mat-label>
            <mat-select formControlName="departmentId">
              @for (d of reference()?.departments ?? []; track d.id) {
                <mat-option [value]="d.id">{{ d.name }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ error('departmentId') }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Job title</mat-label>
            <mat-select formControlName="jobTitleId">
              @for (t of reference()?.jobTitles ?? []; track t.id) {
                <mat-option [value]="t.id">{{ t.name }}</mat-option>
              }
            </mat-select>
            <mat-error>{{ error('jobTitleId') }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Hire date</mat-label>
            <input matInput type="date" formControlName="hireDate" [max]="today" />
            <mat-error>{{ error('hireDate') }}</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Annual salary{{ currency() ? ' (' + currency() + ')' : '' }}</mat-label>
            <input matInput inputmode="decimal" formControlName="salary" autocomplete="off" />
            <mat-hint>Full-time equivalent base pay.</mat-hint>
            <mat-error>{{ error('salary') }}</mat-error>
          </mat-form-field>
        </div>
        @if (formError()) {
          <p class="alert" role="alert">{{ formError() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button type="submit" [disabled]="pending()">{{ pending() ? 'Saving…' : 'Add employee' }}</button>
      </mat-dialog-actions>
    </form>
  `,
})
export class CreateEmployeeDialog {
  private readonly api = inject(EmployeeApi);
  private readonly router = inject(Router);
  private readonly ref = inject(MatDialogRef<CreateEmployeeDialog>);
  readonly reference = inject(ReferenceService).data;

  readonly today = inject(TODAY)();
  readonly labels = EMPLOYMENT_TYPE_LABELS;
  readonly employmentTypes = Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[];
  readonly pending = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = inject(NonNullableFormBuilder).group({
    fullName: ['', [required('Enter a name'), maxLength(200, 'Keep it under 200 characters')]],
    email: ['', [required('Enter an email'), email, maxLength(254, 'Too long')]],
    countryCode: ['', [required('Choose a country')]],
    employmentType: ['FULL_TIME' as EmploymentType],
    departmentId: [null as number | null, [selected('department')]],
    jobTitleId: [null as number | null, [selected('job title')]],
    hireDate: [this.today, [required('Enter the hire date'), notAfter(this.today, 'Hire date cannot be in the future')]],
    salary: ['', [money]],
  });

  private readonly countryCode = toSignal(this.form.controls.countryCode.valueChanges, { initialValue: '' });
  readonly currency = computed(
    () => this.reference()?.countries.find((c) => c.code === this.countryCode())?.currencyCode,
  );

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
      const employee = await this.api.create({
        fullName: v.fullName.trim(), email: v.email.trim(), countryCode: v.countryCode,
        departmentId: Number(v.departmentId), jobTitleId: Number(v.jobTitleId),
        employmentType: v.employmentType, hireDate: v.hireDate, salary: Number(v.salary),
      });
      this.ref.close();
      await this.router.navigate(['/employees', employee.id]);
    } catch (error) {
      this.formError.set(applyServerErrors(error, this.form));
    } finally {
      this.pending.set(false);
    }
  }
}
