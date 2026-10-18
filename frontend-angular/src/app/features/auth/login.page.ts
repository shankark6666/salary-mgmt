import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { toApiError } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { safeNextPath } from '../../core/auth/safe-next-path';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login.page.scss',
  template: `
    <main class="login">
      <section class="card" aria-labelledby="login-title">
        <p class="brand">ACME Salary</p>
        <h1 id="login-title">Sign in</h1>
        <p class="hint">Use your HR account.</p>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <mat-form-field appearance="outline">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" autocomplete="username" cdkFocusInitial />
            @if (form.controls.username.hasError('required')) {
              <mat-error>Enter your username</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
            @if (form.controls.password.hasError('required')) {
              <mat-error>Enter your password</mat-error>
            }
          </mat-form-field>

          @if (error()) {
            <p class="form-error" role="alert">{{ error() }}</p>
          }

          <button mat-flat-button type="submit" [disabled]="pending()">
            {{ pending() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </section>
    </main>
  `,
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Bound from the ?next= query parameter. */
  readonly next = input<string | undefined>();

  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    const { username, password } = this.form.getRawValue();
    if (this.form.invalid || !username.trim()) {
      return;
    }
    this.pending.set(true);
    this.error.set(null);
    try {
      await this.auth.login(username.trim(), password);
      await this.router.navigateByUrl(safeNextPath(this.next()));
    } catch (error) {
      this.error.set(toApiError(error).message);
    } finally {
      this.pending.set(false);
    }
  }
}
