import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { toApiError } from '../../../core/api/api-error';
import { EmployeeApi } from '../data/employee.api';
import type { Employee } from '../data/employee.types';
import type { DialogResult } from './change-salary.dialog';

@Component({
  selector: 'app-deactivate-dialog',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dialog.scss',
  template: `
    <h2 mat-dialog-title>Deactivate {{ employee.fullName }}?</h2>
    <mat-dialog-content>
      <p>
        They will leave the directory and every insight figure, and their record becomes read-only.
        Their salary history is kept.
      </p>
      @if (error()) {
        <p class="alert" role="alert">{{ error() }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close cdkFocusInitial>Cancel</button>
      <button mat-flat-button type="button" class="danger" (click)="confirm()" [disabled]="pending()">
        {{ pending() ? 'Deactivating…' : 'Deactivate' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `.danger { --mat-button-filled-container-color: var(--mat-sys-error); --mat-button-filled-label-text-color: var(--mat-sys-on-error); }`,
})
export class DeactivateDialog {
  readonly employee = inject<Employee>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<DeactivateDialog, DialogResult>);
  private readonly api = inject(EmployeeApi);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  async confirm(): Promise<void> {
    this.pending.set(true);
    try {
      await this.api.deactivate(this.employee.id);
      this.ref.close('saved');
    } catch (error) {
      this.error.set(toApiError(error).message);
    } finally {
      this.pending.set(false);
    }
  }
}
