import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { AuthService } from '../core/auth/auth.service';
import { Shell } from './shell';
import { fakeIcons } from '../testing/icons';

async function renderAs(role: 'HR_MANAGER' | 'HR_ANALYST') {
  const auth = {
    currentUser: signal({ username: 'u', displayName: 'Hana', role }),
    canWrite: signal(role === 'HR_MANAGER'),
    logout: vi.fn().mockResolvedValue(undefined),
  };
  await render(Shell, {
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      fakeIcons,
    ],
  });
  return auth;
}

describe('Shell', () => {
  it('shows the main navigation', async () => {
    await renderAs('HR_MANAGER');

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Insights' })).toHaveAttribute('href', '/insights');
    expect(screen.getByRole('link', { name: 'Employees' })).toHaveAttribute('href', '/employees');
  });

  it('labels managers and read-only analysts', async () => {
    await renderAs('HR_ANALYST');

    expect(screen.getByText('Analyst · read-only')).toBeInTheDocument();
    expect(screen.getByText('Hana')).toBeInTheDocument();
  });
});
