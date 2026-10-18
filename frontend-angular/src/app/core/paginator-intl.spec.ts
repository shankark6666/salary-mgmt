import { AppPaginatorIntl } from './paginator-intl';

describe('AppPaginatorIntl', () => {
  const intl = new AppPaginatorIntl();

  it('formats ranges with thousands separators', () => {
    expect(intl.getRangeLabel(0, 25, 9686)).toBe('1–25 of 9,686');
    expect(intl.getRangeLabel(387, 25, 9686)).toBe('9,676–9,686 of 9,686');
  });

  it('handles an empty result', () => {
    expect(intl.getRangeLabel(0, 25, 0)).toBe('0 of 0');
  });
});
