import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CountPipe, MoneyPipe } from '../../../shared/format/money.pipe';
import { sharedScale, SMALL_GROUP } from '../data/bands';
import type { RolePayStats } from '../data/insights.types';
import { PayBand } from './pay-band';

/** "What do we pay each role here?" — the middle half of salaries per role, on one scale. */
@Component({
  selector: 'app-role-pay-table',
  imports: [MoneyPipe, CountPipe, PayBand],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../insights.scss',
  template: `
    <div class="table-scroll">
      <table class="data" aria-label="Pay by role">
        <thead>
          <tr>
            <th scope="col">Role</th>
            <th scope="col" class="num">People</th>
            <th scope="col" class="num from-sm">25th pct</th>
            <th scope="col" class="num">Median</th>
            <th scope="col" class="num from-sm">75th pct</th>
            <th scope="col" class="track from-sm">Middle 50%</th>
          </tr>
        </thead>
        <tbody>
          @for (r of sorted(); track r.jobTitleId) {
            <tr>
              <td>
                <span class="strong">{{ r.jobTitleName }}</span>
                @if (r.headcount < smallGroup) {
                  <span class="badge" title="Too few people for the statistics to describe a pattern">Small group</span>
                }
              </td>
              <td class="num">{{ r.headcount | count }}</td>
              <td class="num muted from-sm">{{ r.p25 | money: currency() }}</td>
              <td class="num strong">{{ r.median | money: currency() }}</td>
              <td class="num muted from-sm">{{ r.p75 | money: currency() }}</td>
              <td class="from-sm">
                @if (scale(); as s) {
                  <app-pay-band [low]="r.p25" [median]="r.median" [high]="r.p75" [scale]="s" />
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class RolePayTable {
  readonly roles = input.required<RolePayStats[]>();
  readonly currency = input.required<string>();
  readonly smallGroup = SMALL_GROUP;

  // Sorted by median, the bands read as a pay ladder rather than a list.
  readonly sorted = computed(() => [...this.roles()].sort((a, b) => a.median - b.median));
  readonly scale = computed(() => sharedScale(this.sorted().map((r) => ({ low: r.p25, high: r.p75 }))));
}
