import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { apiResource } from '../../../core/api/api-resource';
import { CountPipe, IsoDatePipe, MoneyPipe } from '../../../shared/format/money.pipe';
import { EmptyState, ErrorState } from '../../../shared/ui/state';
import { ReferenceService } from '../../reference/reference.service';
import { ChartComponent } from '../charts/chart';
import type { ChartColors } from '../charts/chart-colors';
import { roleComparisonConfig } from '../charts/configs';
import { SMALL_GROUP } from '../data/bands';
import { insightsRequests } from '../data/insights.api';
import type { RoleCountryComparison } from '../data/insights.types';

const DEFAULT_TITLE = 'Senior Software Engineer';

@Component({
  selector: 'app-insights-roles',
  imports: [MatFormFieldModule, MatSelectModule, ErrorState, EmptyState, ChartComponent, MoneyPipe, CountPipe, IsoDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../insights.scss',
  template: `
    <div class="filters">
      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="wide">
        <mat-label>Job title</mat-label>
        <mat-select [value]="jobTitleId()" (selectionChange)="select($event.value)">
          @for (t of reference()?.jobTitles ?? []; track t.id) {
            <mat-option [value]="t.id">{{ t.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    @if (comparison.error(); as error) {
      <app-error-state [message]="error.message" (retry)="comparison.reload()" />
    } @else if (comparison.value(); as data) {
      @if (data.countries.length === 0) {
        <app-empty-state title="Nobody holds this role yet" description="Choose another job title." />
      } @else {
        <div class="stack" [class.refreshing]="comparison.refreshing()">
          <section class="card" aria-labelledby="role-chart-title">
            <h2 class="card-title" id="role-chart-title">{{ data.jobTitleName }}: pay by country</h2>
            <p class="card-description">
              In US dollars at reference rates of {{ data.fxRatesAsOf | isoDate }}. Band: middle half of salaries · dot: median.
            </p>
            <app-chart [label]="data.jobTitleName + ' pay by country in US dollars; the table below lists the same figures.'"
                       [height]="320" [config]="chart()" />
          </section>
          <section class="card" aria-label="Pay by country for this role">
            <div class="table-scroll">
              <table class="data" [attr.aria-label]="data.jobTitleName + ' pay by country'">
                <thead>
                  <tr>
                    <th scope="col">Country</th>
                    <th scope="col" class="num">People</th>
                    <th scope="col" class="num">Median (local)</th>
                    <th scope="col" class="num">25th pct (USD)</th>
                    <th scope="col" class="num">Median (USD)</th>
                    <th scope="col" class="num">75th pct (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of data.countries; track r.countryCode) {
                    <tr>
                      <td>
                        <span class="strong">{{ r.countryName }}</span>
                        @if (r.headcount < smallGroup) {
                          <span class="badge">Small group</span>
                        }
                      </td>
                      <td class="num">{{ r.headcount | count }}</td>
                      <td class="num">{{ r.medianLocal | money: r.currencyCode }}</td>
                      <td class="num muted">{{ r.p25Usd | money: 'USD' }}</td>
                      <td class="num strong">{{ r.medianUsd | money: 'USD' }}</td>
                      <td class="num muted">{{ r.p75Usd | money: 'USD' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>
      }
    } @else {
      <div class="skeleton block"></div>
    }
  `,
  styles: `.filters mat-form-field.wide { @media (min-width: 640px) { width: 300px; } }`,
})
export class RolesPage {
  private readonly router = inject(Router);
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  readonly reference = inject(ReferenceService).data;
  readonly smallGroup = SMALL_GROUP;

  /** A known id from the URL, else the default title once reference data has arrived. */
  readonly jobTitleId = computed(() => {
    const titles = this.reference()?.jobTitles ?? [];
    const param = Number(this.params().get('jobTitleId'));
    if (titles.some((t) => t.id === param)) return param;
    return titles.find((t) => t.name === DEFAULT_TITLE)?.id ?? titles[0]?.id;
  });

  readonly comparison = apiResource<RoleCountryComparison>(() => {
    const id = this.jobTitleId();
    return id === undefined ? undefined : insightsRequests.roleAcrossCountries(id);
  });

  readonly chart = computed(() => {
    const rows = this.comparison.value()?.countries ?? [];
    return (colors: ChartColors) => roleComparisonConfig(rows, colors);
  });

  select(jobTitleId: number): void {
    void this.router.navigate([], { queryParams: { jobTitleId }, replaceUrl: true });
  }
}
