import { render, screen, within } from '@testing-library/angular';
import type { RolePayStats } from '../data/insights.types';
import { RolePayTable } from './role-pay-table';

const role = (jobTitleId: number, jobTitleName: string, median: number, headcount = 20): RolePayStats => ({
  jobTitleId, jobTitleName, level: 1, headcount, min: median * 0.7, p25: median * 0.9, median, p75: median * 1.1,
  max: median * 1.3,
});

const renderTable = (roles: RolePayStats[], currency: string) =>
  render(RolePayTable, { inputs: { roles, currency } });

describe('RolePayTable', () => {
  it('orders roles from lowest to highest median, as a pay ladder', async () => {
    await renderTable([role(1, 'Director', 4_000_000), role(2, 'Associate', 1_000_000), role(3, 'Manager', 2_500_000)], 'INR');

    const names = screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[0]!.textContent?.trim());
    expect(names).toEqual(['Associate', 'Manager', 'Director']);
  });

  it('flags groups too small for statistics to mean much', async () => {
    await renderTable([role(1, 'Director', 200_000, 3), role(2, 'Associate', 55_000, 40)], 'USD');

    expect(within(screen.getByRole('row', { name: /Director/ })).getByText('Small group')).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /Associate/ })).queryByText('Small group')).not.toBeInTheDocument();
  });

  it("shows percentiles in the row's currency", async () => {
    await renderTable([role(1, 'Associate', 1_000_000)], 'INR');

    expect(screen.getByText('₹10,00,000')).toBeInTheDocument();
  });
});
