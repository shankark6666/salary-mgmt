import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { formatNumber } from '../shared/format/format';

/** "1–25 of 9,686": thousands separators, like every other number in the app. */
@Injectable()
export class AppPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Rows per page';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0) return '0 of 0';
    const start = page * pageSize + 1;
    const end = Math.min((page + 1) * pageSize, length);
    return `${formatNumber(start)}–${formatNumber(end)} of ${formatNumber(length)}`;
  };
}
