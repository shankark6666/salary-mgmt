import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

function runGuard(url: string, user: unknown) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: AuthService, useValue: { restore: vi.fn().mockResolvedValue(user) } }],
  });
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  ) as Promise<boolean | UrlTree>;
}

describe('authGuard', () => {
  it('lets a signed-in user through', async () => {
    expect(await runGuard('/employees', { username: 'hr', displayName: 'HR', role: 'HR_MANAGER' })).toBe(true);
  });

  it('sends everyone else to sign-in, remembering where they were going', async () => {
    const result = await runGuard('/employees?country=IN', null);

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login?next=%2Femployees%3Fcountry%3DIN');
  });
});
