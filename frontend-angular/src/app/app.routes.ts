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
        loadComponent: () => import('./features/insights/components/insights-layout').then((m) => m.InsightsLayout),
        children: [
          {
            path: '',
            title: 'Insights · ACME Salary',
            loadComponent: () => import('./features/insights/pages/overview.page').then((m) => m.OverviewPage),
          },
          {
            path: 'countries',
            title: 'Pay by country · ACME Salary',
            loadComponent: () => import('./features/insights/pages/country.page').then((m) => m.CountryPage),
          },
          {
            path: 'roles',
            title: 'Role comparison · ACME Salary',
            loadComponent: () => import('./features/insights/pages/roles.page').then((m) => m.RolesPage),
          },
          {
            path: 'outliers',
            title: 'Outliers · ACME Salary',
            loadComponent: () => import('./features/insights/pages/outliers.page').then((m) => m.OutliersPage),
          },
        ],
      },
      {
        path: 'employees',
        title: 'Employees · ACME Salary',
        loadComponent: () =>
          import('./features/employees/directory/employee-directory').then((m) => m.EmployeeDirectory),
      },
      {
        path: 'employees/:id',
        title: 'Employee · ACME Salary',
        loadComponent: () => import('./features/employees/detail/employee-detail').then((m) => m.EmployeeDetail),
      },
    ],
  },
  { path: '**', redirectTo: 'insights' },
];
