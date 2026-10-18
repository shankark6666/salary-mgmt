import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { deviationWidth } from '../data/bands';

/**
 * Diverging bar from a centre line: below the peer median grows left in the cool pole, above
 * grows right in the warm pole. The signed % beside it carries the same meaning in text.
 */
@Component({
  selector: 'app-deviation-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `<div class="centre"></div><div class="bar" [class.above]="above()" [style.width.%]="width()"></div>`,
  styles: `
    :host { position: relative; display: block; height: 12px; min-width: 7rem; }
    .centre { position: absolute; inset: 0 auto 0 50%; width: 1px; background: var(--chart-axis); }
    .bar { position: absolute; top: 0; bottom: 0; right: 50%; border-radius: 3px 0 0 3px; background: var(--chart-below); }
    .bar.above { left: 50%; right: auto; border-radius: 0 3px 3px 0; background: var(--chart-above); }
  `,
})
export class DeviationBar {
  readonly deviation = input.required<number>();
  readonly maxAbs = input.required<number>();
  readonly above = computed(() => this.deviation() > 0);
  readonly width = computed(() => deviationWidth(this.deviation(), this.maxAbs()));
}
