import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="state">
      <p class="title">{{ title() }}</p>
      @if (description()) {
        <p class="description">{{ description() }}</p>
      }
    </div>
  `,
  styles: `
    .state { padding: 48px 16px; text-align: center; }
    .title { margin: 0; font: var(--mat-sys-title-small); }
    .description { margin: 6px auto 0; max-width: 28rem; color: var(--mat-sys-on-surface-variant); }
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input<string>();
}

@Component({
  selector: 'app-error-state',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="state" role="alert">
      <mat-icon svgIcon="triangle-alert" aria-hidden="true" />
      <p>{{ message() }}</p>
      @if (retryable()) {
        <button mat-stroked-button type="button" (click)="retry.emit()">Try again</button>
      }
    </div>
  `,
  styles: `
    .state { display: grid; justify-items: center; gap: 8px; padding: 48px 16px; text-align: center; }
    mat-icon { color: var(--mat-sys-error); }
    p { margin: 0; max-width: 28rem; }
  `,
})
export class ErrorState {
  readonly message = input.required<string>();
  readonly retryable = input(true);
  readonly retry = output<void>();
}
