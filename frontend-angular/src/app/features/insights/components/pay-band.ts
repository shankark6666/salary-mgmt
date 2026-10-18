import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BandScale, toPercent } from '../data/bands';

/**
 * Inline p25–p75 band with a median dot on a scale shared by every row. Hidden from screen
 * readers: the same three numbers sit in the row's own cells.
 */
@Component({
  selector: 'app-pay-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="axis"></div>
    <div class="band" [style.left.%]="left()" [style.width.%]="width()"></div>
    <div class="median" [style.left.%]="mid()"></div>
  `,
  styles: `
    :host { position: relative; display: block; height: 16px; min-width: 8rem; }
    .axis { position: absolute; inset: 50% 0 auto; height: 1px; background: var(--chart-grid); }
    .band { position: absolute; top: 50%; height: 10px; transform: translateY(-50%); border-radius: 3px; background: var(--chart-band); }
    .median { position: absolute; top: 50%; width: 12px; height: 12px; transform: translate(-50%, -50%); border-radius: 50%;
      background: var(--chart-series-1); box-shadow: 0 0 0 2px var(--mat-sys-surface); }
  `,
})
export class PayBand {
  readonly low = input.required<number>();
  readonly median = input.required<number>();
  readonly high = input.required<number>();
  readonly scale = input.required<BandScale>();

  readonly left = computed(() => toPercent(this.low(), this.scale()));
  readonly width = computed(() => Math.max(toPercent(this.high(), this.scale()) - this.left(), 0.8));
  readonly mid = computed(() => toPercent(this.median(), this.scale()));
}
