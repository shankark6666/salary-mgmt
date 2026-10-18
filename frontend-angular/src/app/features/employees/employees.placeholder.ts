import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Replaced by the real Employees screens in the next migration PR. */
@Component({
  selector: 'app-employees-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="page-title">Employees</h1>
    <p class="page-description">Directory and salary records.</p>
  `,
})
export class EmployeesPlaceholder {}
