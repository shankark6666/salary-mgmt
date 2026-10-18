import {
  afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, effect, ElementRef, inject, Injector, input,
  signal, viewChild,
} from '@angular/core';
import {
  BarController, BarElement, CategoryScale, Chart, ChartConfiguration, LinearScale, LineController, LineElement,
  PointElement, Tooltip,
} from 'chart.js';
import { ChartColors, readChartColors } from './chart-colors';

// Only what the dashboard draws: bars (incl. floating range bars), median points, tooltips.
Chart.register(BarController, BarElement, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip);

/**
 * A canvas chart. Canvases are images to assistive tech, so callers must provide a label and a
 * table twin with the same numbers next to the chart.
 */
@Component({
  selector: 'app-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="frame" [style.height.px]="height()"><canvas #canvas role="img" [attr.aria-label]="label()"></canvas></div>`,
  styles: `.frame { position: relative; width: 100%; }`,
})
export class ChartComponent {
  readonly label = input.required<string>();
  readonly height = input(300);
  /** Builds the configuration from the current theme colours. */
  readonly config = input.required<(colors: ChartColors) => ChartConfiguration>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly injector = inject(Injector);
  private readonly theme = signal(0);
  private chart?: Chart;

  constructor() {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onThemeChange = () => this.theme.update((n) => n + 1);
    media.addEventListener('change', onThemeChange);
    inject(DestroyRef).onDestroy(() => {
      media.removeEventListener('change', onThemeChange);
      this.chart?.destroy();
    });

    afterNextRender(() => {
      effect(
        () => {
          this.theme(); // re-read the CSS colour tokens when the system theme flips
          this.draw(this.config()(readChartColors()));
        },
        { injector: this.injector },
      );
    });
  }

  private draw(config: ChartConfiguration): void {
    const context = this.canvas().nativeElement.getContext('2d');
    if (!context) return; // no canvas support (e.g. jsdom in unit tests): the table twin carries the data
    this.chart?.destroy();
    this.chart = new Chart(context, config);
  }
}
