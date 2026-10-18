import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import { BehaviorSubject } from 'rxjs';
import { sessionAndErrorInterceptor } from '../../../core/api/interceptors';
import { AuthService } from '../../../core/auth/auth.service';
import { fakeIcons } from '../../../testing/icons';
import { ReferenceService } from '../../reference/reference.service';
import type { Employee } from '../data/employee.types';
import { EmployeeDirectory } from './employee-directory';

const priya: Employee = {
  id: 7, employeeCode: 'EMP-00007', fullName: 'Priya Sharma', email: 'priya@acme.com', countryCode: 'IN',
  countryName: 'India', currencyCode: 'INR', departmentId: 1, departmentName: 'Engineering', jobTitleId: 5,
  jobTitleName: 'Senior Software Engineer', employmentType: 'FULL_TIME', hireDate: '2024-03-01',
  salary: 2917950, salaryUsd: 35015.4, active: true, version: 0,
};

async function renderAs(role: 'HR_MANAGER' | 'HR_ANALYST', search = 'country=IN') {
  const query = new BehaviorSubject(convertToParamMap(Object.fromEntries(new URLSearchParams(search))));
  await render(EmployeeDirectory, {
    providers: [
      provideRouter([]),
      provideHttpClient(withInterceptors([sessionAndErrorInterceptor])),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { queryParamMap: query } },
      { provide: AuthService, useValue: { canWrite: signal(role === 'HR_MANAGER') } },
      { provide: ReferenceService, useValue: { data: signal({ countries: [], departments: [], jobTitles: [], fxRatesAsOf: '2026-10-01' }) } },
      fakeIcons,
    ],
  });
  return TestBed.inject(HttpTestingController);
}

function respond(http: HttpTestingController, content: Employee[]) {
  const request = http.expectOne((r) => r.url === '/api/v1/employees');
  request.flush({ success: true, data: { content, page: 0, size: 25, totalElements: content.length, totalPages: 1 } });
  return request.request;
}

describe('EmployeeDirectory', () => {
  it('queries with the filters from the URL', async () => {
    const http = await renderAs('HR_ANALYST', 'country=IN&sort=salaryUsd&direction=DESC&page=2');

    const request = respond(http, []);

    expect(request.params.get('country')).toBe('IN');
    expect(request.params.get('sort')).toBe('salaryUsd');
    expect(request.params.get('direction')).toBe('DESC');
    expect(request.params.get('page')).toBe('1');
    expect(request.params.get('status')).toBe('ACTIVE');
  });

  it('shows local salary with its USD equivalent and links to the employee', async () => {
    const http = await renderAs('HR_ANALYST');
    respond(http, [priya]);

    const row = await screen.findByRole('row', { name: /Priya Sharma/ });
    expect(within(row).getByText('₹29,17,950')).toBeInTheDocument();
    expect(within(row).getByText('≈ $35,015')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: 'Priya Sharma' })).toHaveAttribute('href', '/employees/7');
  });

  it('lets managers add employees and export what they are looking at', async () => {
    const http = await renderAs('HR_MANAGER');
    respond(http, [priya]);

    expect(await screen.findByRole('button', { name: /Add employee/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Export CSV/ })).toHaveAttribute(
      'href', expect.stringContaining('/api/v1/employees/export?country=IN'),
    );
  });

  it('hides write actions from read-only analysts', async () => {
    const http = await renderAs('HR_ANALYST');
    respond(http, []);

    expect(await screen.findByText('No employees match')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add employee/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Export CSV/ })).not.toBeInTheDocument();
  });

  it('explains errors in plain words with a retry', async () => {
    const http = await renderAs('HR_ANALYST');
    http.expectOne((r) => r.url === '/api/v1/employees')
      .flush({ success: false, errorCode: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }, { status: 500, statusText: 'Error' });

    expect(await screen.findByRole('alert')).toHaveTextContent('An unexpected error occurred');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
