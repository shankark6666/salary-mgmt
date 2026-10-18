import { Pipe, PipeTransform } from '@angular/core';
import { formatDate, formatMoney, formatMoneyCompact, formatNumber, formatPercent } from './format';

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(amount: number | null | undefined, currency: string, compact = false): string {
    return compact ? formatMoneyCompact(amount, currency) : formatMoney(amount, currency);
  }
}

@Pipe({ name: 'isoDate' })
export class IsoDatePipe implements PipeTransform {
  transform(value: string): string {
    return formatDate(value);
  }
}

@Pipe({ name: 'count' })
export class CountPipe implements PipeTransform {
  transform(value: number): string {
    return formatNumber(value);
  }
}

@Pipe({ name: 'signedPercent' })
export class SignedPercentPipe implements PipeTransform {
  transform(value: number): string {
    return formatPercent(value);
  }
}
