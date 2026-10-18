import { provideRouter, Router } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { ApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { LoginPage } from './login.page';

async function renderLogin(next?: string) {
  const auth = { login: vi.fn() };
  const view = await render(LoginPage, {
    providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    inputs: next ? { next } : {},
  });
  const router = view.fixture.debugElement.injector.get(Router);
  const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
  return { auth, navigate };
}

async function signIn(username: string, password: string) {
  await userEvent.type(screen.getByLabelText('Username'), username);
  await userEvent.type(screen.getByLabelText('Password'), password);
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('LoginPage', () => {
  it('asks for both fields before calling the server', async () => {
    const { auth } = await renderLogin();

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter your username')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('signs in and returns to the page the user came from', async () => {
    const { auth, navigate } = await renderLogin('/employees?country=IN');
    auth.login.mockResolvedValue({ username: 'hr', displayName: 'HR', role: 'HR_MANAGER' });

    await signIn('hr.manager', 'secret-password');

    expect(auth.login).toHaveBeenCalledWith('hr.manager', 'secret-password');
    expect(navigate).toHaveBeenCalledWith('/employees?country=IN');
  });

  it('ignores an external next= target', async () => {
    const { auth, navigate } = await renderLogin('https://evil.example');
    auth.login.mockResolvedValue({ username: 'hr', displayName: 'HR', role: 'HR_MANAGER' });

    await signIn('hr.manager', 'secret-password');

    expect(navigate).toHaveBeenCalledWith('/insights');
  });

  it("shows the server's generic message on failure", async () => {
    const { auth, navigate } = await renderLogin();
    auth.login.mockRejectedValue(new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid username or password'));

    await signIn('hr.manager', 'wrong');

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password');
    expect(navigate).not.toHaveBeenCalled();
  });
});
