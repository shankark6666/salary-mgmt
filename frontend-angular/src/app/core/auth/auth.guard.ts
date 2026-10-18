import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Pages require a session; without one, go to sign-in and come back afterwards. This is a UX
 * guard only — the API checks the session on every call.
 *
 * Both dependencies are injected before the first await: inject() only works synchronously in
 * the injection context, and calling it after an await throws NG0203.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = await auth.restore();
  if (user) {
    return true;
  }
  return router.createUrlTree(['/login'], { queryParams: { next: state.url } });
};
