import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Replaced by the real Insights screens in the next migration PR. */
@Component({
  selector: 'app-insights-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="page-title">Insights</h1>
    <p class="page-description">How ACME pays people.</p>
  `,
})
export class InsightsPlaceholder {}
