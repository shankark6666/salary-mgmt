import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CountPipe, MoneyPipe } from '../../../shared/format/money.pipe';
import type { CountryPayStats } from '../data/insights.types';

/** The table twin of the country chart, plus the local-currency detail the chart leaves out. */
@Component({
  selector: 'app-country-pay-table',
  imports: [RouterLink, MoneyPipe, CountPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../insights.scss',
  template: `
    <div class="table-scroll">
      <table class="data" aria-label="Pay by country">
        <thead>
          <tr>
            <th scope="col">Country</th>
            <th scope="col" class="num">People</th>
            <th scope="col" class="num">Median (local)</th>
            <th scope="col" class="num from-md">Range (local)</th>
            <th scope="col" class="num">Median (USD)</th>
            <th scope="col" class="num from-sm">Payroll (USD)</th>
          </tr>
        </thead>
        <tbody>
          @for (c of countries(); track c.countryCode) {
            <tr>
              <td>
                <a class="link" routerLink="/insights/countries" [queryParams]="{ country: c.countryCode }">{{ c.countryName }}</a>
              </td>
              <td class="num">{{ c.headcount | count }}</td>
              <td class="num">{{ c.median | money: c.currencyCode }}</td>
              <td class="num muted from-md">{{ c.min | money: c.currencyCode }} – {{ c.max | money: c.currencyCode }}</td>
              <td class="num">{{ c.medianUsd | money: 'USD' }}</td>
              <td class="num from-sm">{{ c.payrollUsd | money: 'USD' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class CountryPayTable {
  readonly countries = input.required<CountryPayStats[]>();
}
