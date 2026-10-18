import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in · ACME Salary',
    loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'insights' },
      {
        path: 'insights',
        title: 'Insights · ACME Salary',
        loadComponent: () => import('./features/insights/insights.placeholder').then((m) => m.InsightsPlaceholder),
      },
      {
        path: 'employees',
        title: 'Employees · ACME Salary',
        loadComponent: () => import('./features/employees/employees.placeholder').then((m) => m.EmployeesPlaceholder),
      },
    ],
  },
  { path: '**', redirectTo: 'insights' },
];
