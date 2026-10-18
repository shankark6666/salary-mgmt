import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../../core/api/api-error';
import { TODAY } from '../../../core/time/today';
import { EmployeeApi } from '../data/employee.api';
import type { Employee } from '../data/employee.types';
import { ChangeSalaryDialog } from './change-salary.dialog';

const employee = { id: 7, fullName: 'Priya Sharma', salary: 80000, currencyCode: 'USD', version: 3 } as Employee;

async function renderDialog() {
  const api = { changeSalary: vi.fn() };
  const ref = { close: vi.fn() };
  await render(ChangeSalaryDialog, {
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: { employee, latestChangeDate: '2025-03-01' } },
      { provide: MatDialogRef, useValue: ref },
      { provide: EmployeeApi, useValue: api },
      { provide: TODAY, useValue: () => '2026-10-15' },
    ],
  });
  return { api, ref };
}

const salary = () => screen.getByLabelText(/New annual salary \(USD\)/);
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Record change' }));

describe('ChangeSalaryDialog', () => {
  it('previews the percentage change as the amount is typed', async () => {
    await renderDialog();

    await userEvent.type(salary(), '88000');

    expect(await screen.findByText('+10.0% vs current salary')).toBeInTheDocument();
  });

  it('warns about changes large enough to be a typo', async () => {
    await renderDialog();

    await userEvent.type(salary(), '8000');

    expect(await screen.findByText('-90.0% vs current salary')).toBeInTheDocument();
    expect(screen.getByText(/extra or missing zero/)).toBeInTheDocument();
  });

  it('does not warn about an ordinary raise', async () => {
    await renderDialog();

    await userEvent.type(salary(), '84000');

    expect(await screen.findByText('+5.0% vs current salary')).toBeInTheDocument();
    expect(screen.queryByText(/extra or missing zero/)).not.toBeInTheDocument();
  });

  it('sends the amount, date, reason and the version the user was looking at', async () => {
    const { api, ref } = await renderDialog();
    api.changeSalary.mockResolvedValue(employee);

    await userEvent.type(salary(), '88000');
    await userEvent.click(screen.getByRole('button', { name: 'Promotion' }));
    await submit();

    expect(api.changeSalary).toHaveBeenCalledWith(7, {
      version: 3, newSalary: 88000, effectiveDate: '2026-10-15', reason: 'Promotion',
    });
    expect(ref.close).toHaveBeenCalledWith('saved');
  });

  it('blocks an unchanged salary without calling the server', async () => {
    const { api } = await renderDialog();

    await userEvent.type(salary(), '80000');
    await userEvent.type(screen.getByLabelText('Reason'), 'Review');
    await submit();

    expect(await screen.findByText('That is the current salary')).toBeInTheDocument();
    expect(api.changeSalary).not.toHaveBeenCalled();
  });

  it('offers a reload when someone else changed the employee first', async () => {
    const { api, ref } = await renderDialog();
    api.changeSalary.mockRejectedValue(new ApiError(409, 'CONFLICT', 'This employee was changed by someone else. Reload and try again.'));

    await userEvent.type(salary(), '88000');
    await userEvent.type(screen.getByLabelText('Reason'), 'Annual review');
    await submit();
    await userEvent.click(await screen.findByRole('button', { name: 'Reload' }));

    expect(ref.close).toHaveBeenCalledWith('reload');
  });

  it('puts server field errors on the matching input', async () => {
    const { api } = await renderDialog();
    api.changeSalary.mockRejectedValue(
      new ApiError(400, 'VALIDATION_FAILED', 'Request validation failed', { reason: 'size must be between 0 and 500' }),
    );

    await userEvent.type(salary(), '88000');
    await userEvent.type(screen.getByLabelText('Reason'), 'Annual review');
    await submit();

    expect(await screen.findByText('size must be between 0 and 500')).toBeInTheDocument();
  });
});
