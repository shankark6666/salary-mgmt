import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { apiResource } from '../../../core/api/api-resource';
import { formatMoney, formatMoneyCompact, formatNumber } from '../../../shared/format/format';
import { ErrorState } from '../../../shared/ui/state';
import { ReferenceService } from '../../reference/reference.service';
import { ChartComponent } from '../charts/chart';
import type { ChartColors } from '../charts/chart-colors';
import { distributionConfig } from '../charts/configs';
import { RolePayTable } from '../components/role-pay-table';
import { StatTile } from '../components/stat-tile';
import { insightsRequests } from '../data/insights.api';
import type { CountryRolePay, OrgOverview, SalaryDistribution } from '../data/insights.types';

const DEFAULT_COUNTRY = 'US';

@Component({
  selector: 'app-insights-country',
  imports: [MatFormFieldModule, MatSelectModule, ErrorState, StatTile, ChartComponent, RolePayTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../insights.scss',
  template: `
    <div class="filters">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Country</mat-label>
        <mat-select [value]="country()" (selectionChange)="select($event.value)">
          @for (c of reference()?.countries ?? []; track c.code) {
            <mat-option [value]="c.code">{{ c.name }} ({{ c.currencyCode }})</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <!-- A new country keeps the frame: the previous one stays, dimmed, until it arrives. -->
    <div class="stack" [class.refreshing]="roles.refreshing() || distribution.refreshing()">
      <div class="tiles">
        @if (stats(); as s) {
          <app-stat-tile label="Active employees" [value]="count(s.headcount)" />
          <app-stat-tile label="Median salary" [value]="money(s.median, s.currencyCode)" [detail]="'≈ ' + money(s.medianUsd, 'USD')" />
          <app-stat-tile label="Annual payroll" [value]="compactUsd(s.payrollUsd)" [detail]="money(s.payrollUsd, 'USD') + ' in US dollars'" />
        } @else {
          <div class="skeleton tile"></div><div class="skeleton tile"></div><div class="skeleton tile"></div>
        }
      </div>

      <section class="card" aria-labelledby="distribution-title">
        <h2 class="card-title" id="distribution-title">Salary distribution</h2>
        <p class="card-description">How many people earn within each band, in local currency.</p>
        @if (distribution.error(); as error) {
          <app-error-state [message]="error.message" (retry)="distribution.reload()" />
        } @else if (distribution.value(); as d) {
          <app-chart [label]="'Number of employees per salary band in ' + d.currencyCode + '; the table below lists the same counts.'"
                     [height]="280" [config]="distributionChart()" />
          <details class="twin">
            <summary>Show as a table</summary>
            <div class="table-scroll">
              <table class="data" aria-label="Salary distribution">
                <thead><tr><th scope="col">Salary band ({{ d.currencyCode }})</th><th scope="col" class="num">People</th></tr></thead>
                <tbody>
                  @for (b of d.buckets; track b.lower) {
                    <tr>
                      <td class="tabular">{{ money(b.lower, d.currencyCode) }} – {{ money(b.upper, d.currencyCode) }}</td>
                      <td class="num">{{ count(b.count) }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </details>
        } @else {
          <div class="skeleton block"></div>
        }
      </section>

      <section class="card" aria-labelledby="roles-title">
        <h2 class="card-title" id="roles-title">Pay by role</h2>
        <p class="card-description">
          Lowest to highest median. The band covers the middle half of salaries (25th to 75th percentile); the dot is
          the median. All rows share one scale.
        </p>
        @if (roles.error(); as error) {
          <app-error-state [message]="error.message" (retry)="roles.reload()" />
        } @else if (roles.value(); as r) {
          <app-role-pay-table [roles]="r.roles" [currency]="r.currencyCode" />
        } @else {
          <div class="skeleton block"></div>
        }
      </section>
    </div>
  `,
  styles: `
    .twin { margin-top: 12px; }
    .twin summary { cursor: pointer; color: var(--mat-sys-on-surface-variant); font: var(--mat-sys-label-large); }
  `,
})
export class CountryPage {
  private readonly router = inject(Router);
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  readonly reference = inject(ReferenceService).data;

  /** The URL decides the country; unknown codes fall back rather than asking the API for them. */
  readonly country = computed(() => {
    const param = this.params().get('country');
    const countries = this.reference()?.countries;
    const known = countries ? countries.some((c) => c.code === param) : true;
    return param && known && /^[A-Z]{2}$/.test(param) ? param : DEFAULT_COUNTRY;
  });

  readonly overview = apiResource<OrgOverview>(() => insightsRequests.overview());
  readonly roles = apiResource<CountryRolePay>(() => insightsRequests.rolesInCountry(this.country()));
  readonly distribution = apiResource<SalaryDistribution>(() => insightsRequests.distribution(this.country()));

  readonly stats = computed(() => this.overview.value()?.countries.find((c) => c.countryCode === this.country()));
  readonly distributionChart = computed(() => {
    const d = this.distribution.value();
    return (colors: ChartColors) => distributionConfig(d ?? { countryCode: '', currencyCode: 'USD', headcount: 0, bucketWidth: null, buckets: [] }, colors);
  });

  readonly count = formatNumber;
  readonly money = formatMoney;
  readonly compactUsd = (amount: number) => formatMoneyCompact(amount, 'USD');

  select(country: string): void {
    void this.router.navigate([], { queryParams: { country }, replaceUrl: true });
  }
}
