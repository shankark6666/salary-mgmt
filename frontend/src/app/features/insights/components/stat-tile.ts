import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Label · value · detail. Large figures use proportional digits (tabular only in columns). */
@Component({
  selector: 'app-stat-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="label">{{ label() }}</p>
    <p class="value">{{ value() }}</p>
    @if (detail()) {
      <p class="detail">{{ detail() }}</p>
    }
  `,
  styles: `
    :host { display: block; padding: 20px; border: 1px solid var(--mat-sys-outline-variant); border-radius: 12px; background: var(--mat-sys-surface); }
    p { margin: 0; }
    .label { color: var(--mat-sys-on-surface-variant); }
    .value { margin-top: 4px; font: var(--mat-sys-headline-medium); overflow-wrap: anywhere; }
    .detail { margin-top: 4px; font: var(--mat-sys-body-small); color: var(--mat-sys-on-surface-variant); }
  `,
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
  readonly detail = input<string>();
}
