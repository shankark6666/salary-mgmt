import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import type { ApiEnvelope } from '../api/api.types';
import type { CurrentUser } from './auth.types';

/**
 * The signed-in user, held in a signal. The session itself lives in an HttpOnly cookie the
 * browser manages; this app never sees or stores a credential or token.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly user = signal<CurrentUser | null>(null);

  readonly currentUser = this.user.asReadonly();
  readonly canWrite = computed(() => this.user()?.role === 'HR_MANAGER');

  /** Loads the session's user; resolves null when not signed in. */
  async restore(): Promise<CurrentUser | null> {
    if (this.user()) {
      return this.user();
    }
    try {
      const me = await firstValueFrom(this.get<CurrentUser>('/api/v1/auth/me'));
      this.user.set(me);
      return me;
    } catch {
      return null;
    }
  }

  async login(username: string, password: string): Promise<CurrentUser> {
    // Sets the XSRF-TOKEN cookie the login POST must echo back.
    await firstValueFrom(this.http.get('/api/v1/auth/csrf'));
    const user = await firstValueFrom(
      this.http
        .post<ApiEnvelope<CurrentUser>>('/api/v1/auth/login', { username, password })
        .pipe(map((response) => response.data as CurrentUser)),
    );
    this.user.set(user);
    return user;
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post('/api/v1/auth/logout', null));
    } finally {
      this.user.set(null);
    }
  }

  private get<T>(url: string) {
    return this.http.get<ApiEnvelope<T>>(url).pipe(map((response) => response.data as T));
  }
}
