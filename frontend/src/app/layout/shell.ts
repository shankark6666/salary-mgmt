import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './shell.scss',
  template: `
    <div class="shell">
      <aside class="side">
        <p class="brand">ACME Salary</p>
        <nav aria-label="Main" class="nav">
          @for (item of nav; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" ariaCurrentWhenActive="page">
              <mat-icon [svgIcon]="item.icon" aria-hidden="true" />
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="user">
          @if (user(); as u) {
            <div class="who">
              <p class="name">{{ u.displayName }}</p>
              <span class="badge">{{ roleLabel() }}</span>
            </div>
          }
          <button mat-button class="sign-out" (click)="signOut()" [disabled]="signingOut()" aria-label="Sign out">
            <mat-icon svgIcon="log-out" aria-hidden="true" />
            <span class="label">Sign out</span>
          </button>
        </div>
      </aside>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class Shell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly nav = [
    { path: '/insights', label: 'Insights', icon: 'chart-column' },
    { path: '/employees', label: 'Employees', icon: 'users' },
  ];
  readonly user = this.auth.currentUser;
  readonly roleLabel = computed(() => (this.auth.canWrite() ? 'Manager' : 'Analyst · read-only'));
  readonly signingOut = signal(false);

  async signOut(): Promise<void> {
    this.signingOut.set(true);
    await this.auth.logout().catch(() => undefined);
    // Full reload: nothing from the previous session stays in memory.
    window.location.assign('/login');
  }
}
