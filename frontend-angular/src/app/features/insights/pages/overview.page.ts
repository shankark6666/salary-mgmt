import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { apiResource } from '../../../core/api/api-resource';
import { formatDate, formatMoney, formatMoneyCompact, formatNumber } from '../../../shared/format/format';
import { ErrorState } from '../../../shared/ui/state';
import { ChartComponent } from '../charts/chart';
import type { ChartColors } from '../charts/chart-colors';
import { countryMedianConfig } from '../charts/configs';
import { CountryPayTable } from '../components/country-pay-table';
import { StatTile } from '../components/stat-tile';
import { insightsRequests } from '../data/insights.api';
import type { OrgOverview } from '../data/insights.types';

@Component({
  selector: 'app-insights-overview',
  imports: [ErrorState, StatTile, ChartComponent, CountryPayTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../insights.scss',
  template: `
    @if (overview.error(); as error) {
      <app-error-state [message]="error.message" (retry)="overview.reload()" />
    } @else if (overview.value(); as data) {
      <div class="stack">
        <div class="tiles">
          <app-stat-tile label="Active employees" [value]="count(data.headcount)" [detail]="'Across ' + data.countries.length + ' countries'" />
          <app-stat-tile label="Annual payroll" [value]="compactUsd(data.payrollUsd)" [detail]="fxNote()" />
          <app-stat-tile label="Median salary" [value]="usd(data.medianUsd)" detail="Half the company earns more, half less" />
        </div>
        <section class="card" aria-labelledby="country-median-title">
          <h2 class="card-title" id="country-median-title">Median salary by country</h2>
          <p class="card-description">In US dollars so countries are comparable. {{ fxNote() }}.</p>
          <app-chart label="Median salary by country in US dollars; the table below lists the same figures."
                     [height]="chartHeight()" [config]="chart()" />
        </section>
        <section class="card" aria-labelledby="country-table-title">
          <h2 class="card-title" id="country-table-title">Pay by country</h2>
          <p class="card-description">
            Sorted by payroll. Local currency is what people are actually paid; select a country for its roles and distribution.
          </p>
          <app-country-pay-table [countries]="data.countries" />
        </section>
      </div>
    } @else {
      <div class="stack" aria-busy="true">
        <div class="tiles">
          <div class="skeleton tile"></div><div class="skeleton tile"></div><div class="skeleton tile"></div>
        </div>
        <div class="skeleton block"></div>
      </div>
    }
  `,
})
export class OverviewPage {
  readonly overview = apiResource<OrgOverview>(() => insightsRequests.overview());

  readonly fxNote = computed(() => {
    const data = this.overview.value();
    return data ? `USD at reference rates of ${formatDate(data.fxRatesAsOf)}` : '';
  });
  readonly chart = computed(() => {
    const countries = this.overview.value()?.countries ?? [];
    return (colors: ChartColors) => countryMedianConfig(countries, colors);
  });
  /** One bar per country: the chart grows with the data rather than squeezing bars. */
  readonly chartHeight = computed(() => Math.max(200, (this.overview.value()?.countries.length ?? 0) * 36 + 40));

  readonly count = formatNumber;
  readonly usd = (amount: number) => formatMoney(amount, 'USD');
  readonly compactUsd = (amount: number) => formatMoneyCompact(amount, 'USD');
}
