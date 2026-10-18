import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { apiResource } from '../../../core/api/api-resource';
import { AuthService } from '../../../core/auth/auth.service';
import { IsoDatePipe, MoneyPipe, SignedPercentPipe } from '../../../shared/format/money.pipe';
import { PageHeader } from '../../../shared/ui/page-header';
import { ErrorState } from '../../../shared/ui/state';
import { ReferenceService } from '../../reference/reference.service';
import { EMPLOYMENT_TYPE_LABELS, type Employee, type SalaryHistoryEntry } from '../data/employee.types';
import { ChangeSalaryDialog, type ChangeSalaryData, type DialogResult } from '../dialogs/change-salary.dialog';
import { DeactivateDialog } from '../dialogs/deactivate.dialog';
import { EditEmployeeDialog } from '../dialogs/edit-employee.dialog';

@Component({
  selector: 'app-employee-detail',
  imports: [
    RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule, MatTableModule, PageHeader, ErrorState,
    MoneyPipe, IsoDatePipe, SignedPercentPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './employee-detail.scss',
  templateUrl: './employee-detail.html',
})
export class EmployeeDetail {
  private readonly dialog = inject(MatDialog);
  readonly auth = inject(AuthService);
  readonly reference = inject(ReferenceService).data;
  readonly labels = EMPLOYMENT_TYPE_LABELS;

  /** Route parameter, bound by the router. */
  readonly id = input.required<string>();
  private readonly employeeId = computed(() => (/^\d{1,18}$/.test(this.id()) ? Number(this.id()) : null));

  readonly employee = apiResource<Employee>(() => {
    const id = this.employeeId();
    return id === null ? undefined : `/api/v1/employees/${id}`;
  });
  readonly history = apiResource<SalaryHistoryEntry[]>(() => {
    const id = this.employeeId();
    return id === null ? undefined : `/api/v1/employees/${id}/salary-history`;
  });

  /** Newest first: the question is usually "what happened most recently, and why?" */
  readonly timeline = computed(() =>
    [...(this.history.value() ?? [])].reverse().map((entry) => ({
      ...entry,
      delta: entry.previousSalary === null ? null : ((entry.newSalary - entry.previousSalary) / entry.previousSalary) * 100,
    })),
  );
  readonly latestChangeDate = computed(() => this.history.value()?.at(-1)?.effectiveDate);
  readonly editable = computed(() => this.auth.canWrite() && this.employee.value()?.active === true);
  readonly notFound = computed(() => this.employeeId() === null || this.employee.error()?.status === 404);
  readonly columns = ['effectiveDate', 'salary', 'change', 'reason', 'changedBy'];

  edit(employee: Employee): void {
    this.afterClose(this.dialog.open(EditEmployeeDialog, { data: employee, width: '600px', maxWidth: '95vw' }));
  }

  changeSalary(employee: Employee): void {
    const data: ChangeSalaryData = { employee, latestChangeDate: this.latestChangeDate() ?? employee.hireDate };
    this.afterClose(this.dialog.open(ChangeSalaryDialog, { data, width: '520px', maxWidth: '95vw' }));
  }

  deactivate(employee: Employee): void {
    this.afterClose(this.dialog.open(DeactivateDialog, { data: employee, width: '480px', maxWidth: '95vw' }));
  }

  private afterClose(ref: { afterClosed(): { subscribe(fn: (r: DialogResult) => void): unknown } }): void {
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.employee.reload();
        this.history.reload();
      }
    });
  }
}
