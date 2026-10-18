import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Page } from '../../../core/api/api.types';
import { apiResource } from '../../../core/api/api-resource';
import { MoneyPipe, SignedPercentPipe } from '../../../shared/format/money.pipe';
import { formatNumber } from '../../../shared/format/format';
import { EmptyState, ErrorState } from '../../../shared/ui/state';
import { ReferenceService } from '../../reference/reference.service';
import { DeviationBar } from '../components/deviation-bar';
import { SMALL_GROUP } from '../data/bands';
import { insightsRequests } from '../data/insights.api';
import type { OutlierQuery, PayOutlier } from '../data/insights.types';
import { outlierSearchParams, parseOutlierQuery, THRESHOLDS } from '../data/outlier-query';

@Component({
  selector: 'app-insights-outliers',
  imports: [
    RouterLink, MatFormFieldModule, MatSelectModule, MatPaginatorModule, MatProgressBarModule, ErrorState, EmptyState,
    DeviationBar, MoneyPipe, SignedPercentPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../insights.scss',
  template: `
    <div class="filters">
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Differs from peers by</mat-label>
        <mat-select [value]="query().threshold" (selectionChange)="update({ threshold: $event.value })">
          @for (t of thresholds; track t) {
            <mat-option [value]="t">{{ t }}% or more</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Country</mat-label>
        <mat-select [value]="query().country" (selectionChange)="update({ country: $event.value })">
          <mat-option [value]="null">All countries</mat-option>
          @for (c of reference()?.countries ?? []; track c.code) {
            <mat-option [value]="c.code">{{ c.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field appearance="outline" subscriptSizing="dynamic">
        <mat-label>Job title</mat-label>
        <mat-select [value]="query().jobTitleId" (selectionChange)="update({ jobTitleId: $event.value })">
          <mat-option [value]="null">All job titles</mat-option>
          @for (t of reference()?.jobTitles ?? []; track t.id) {
            <mat-option [value]="t.id">{{ t.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>

    <section class="card" aria-labelledby="outliers-title">
      <h2 class="card-title" id="outliers-title">{{ heading() }}</h2>
      <p class="card-description">
        Peers are active colleagues with the same job title in the same country. Groups under {{ smallGroup }} people are
        skipped: with so few, the median is one person's pay.
      </p>
      @if (outliers.loading()) {
        <mat-progress-bar mode="indeterminate" aria-label="Loading outliers" />
      }
      @if (outliers.error(); as error) {
        <app-error-state [message]="error.message" (retry)="outliers.reload()" />
      } @else if (outliers.value(); as page) {
        @if (page.totalElements === 0) {
          <app-empty-state title="No outliers at this threshold"
                           description="Everyone is paid within this range of their peers. Try a lower threshold." />
        } @else {
          <div class="table-scroll" [class.refreshing]="outliers.refreshing()">
            <table class="data" aria-label="Employees paid far from their peers">
              <thead>
                <tr>
                  <th scope="col">Employee</th>
                  <th scope="col" class="from-md">Role</th>
                  <th scope="col" class="num">Salary</th>
                  <th scope="col" class="num from-sm">Peer median</th>
                  <th scope="col" class="num">Difference</th>
                  <th scope="col" class="track from-sm"><span class="visually-hidden">Below or above peers</span></th>
                </tr>
              </thead>
              <tbody>
                @for (o of page.content; track o.employeeId) {
                  <tr>
                    <td>
                      <a class="link" [routerLink]="['/employees', o.employeeId]">{{ o.fullName }}</a>
                      <span class="sub">{{ o.employeeCode }} · {{ o.countryCode }}</span>
                    </td>
                    <td class="from-md">
                      {{ o.jobTitleName }}
                      <span class="sub">Peer group of {{ o.peerCount }}</span>
                    </td>
                    <td class="num">{{ o.salary | money: o.currencyCode }}</td>
                    <td class="num muted from-sm">{{ o.peerMedian | money: o.currencyCode }}</td>
                    <td class="num strong">
                      {{ o.deviationPercent | signedPercent }}
                      <span class="visually-hidden">{{ o.deviationPercent > 0 ? 'above' : 'below' }} the peer median</span>
                    </td>
                    <td class="from-sm"><app-deviation-bar [deviation]="o.deviationPercent" [maxAbs]="maxAbs()" /></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <mat-paginator [length]="page.totalElements" [pageIndex]="page.page" [pageSize]="page.size" [hidePageSize]="true"
                         (page)="onPage($event)" aria-label="Outlier pages" />
        }
      } @else {
        <div class="skeleton block"></div>
      }
    </section>
  `,
})
export class OutliersPage {
  private readonly router = inject(Router);
  private readonly params = toSignal(inject(ActivatedRoute).queryParamMap, { requireSync: true });
  readonly reference = inject(ReferenceService).data;
  readonly thresholds = THRESHOLDS;
  readonly smallGroup = SMALL_GROUP;

  readonly query = computed(() => parseOutlierQuery(this.params()));
  readonly outliers = apiResource<Page<PayOutlier>>(() => insightsRequests.outliers(this.query()));

  readonly heading = computed(() => {
    const page = this.outliers.value();
    return `${page ? `${formatNumber(page.totalElements)} people` : 'Outliers'} paid far from their peers`;
  });
  /** The longest bar on the page fills its half; the rest stay proportional to it. */
  readonly maxAbs = computed(() =>
    Math.max(0, ...(this.outliers.value()?.content.map((o) => Math.abs(o.deviationPercent)) ?? [])),
  );

  update(patch: Partial<OutlierQuery>): void {
    const params = outlierSearchParams({ ...this.query(), page: 0, ...patch });
    void this.router.navigate([], { queryParams: Object.fromEntries(params), replaceUrl: true });
  }

  onPage(event: PageEvent): void {
    this.update({ page: event.pageIndex });
  }
}
