import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { render, screen, within } from '@testing-library/angular';
import { BehaviorSubject } from 'rxjs';
import { sessionAndErrorInterceptor } from '../../../core/api/interceptors';
import { ReferenceService } from '../../reference/reference.service';
import type { PayOutlier } from '../data/insights.types';
import { OutliersPage } from './outliers.page';

const outlier = (employeeId: number, fullName: string, deviationPercent: number): PayOutlier => ({
  employeeId, employeeCode: `EMP-${employeeId}`, fullName, countryCode: 'US', currencyCode: 'USD',
  jobTitleId: 1, jobTitleName: 'Associate', salary: 110900, peerMedian: 55200, deviationPercent, peerCount: 696,
});

async function renderPage(search = '') {
  const query = new BehaviorSubject(convertToParamMap(Object.fromEntries(new URLSearchParams(search))));
  await render(OutliersPage, {
    providers: [
      provideRouter([]),
      provideHttpClient(withInterceptors([sessionAndErrorInterceptor])),
      provideHttpClientTesting(),
      { provide: ActivatedRoute, useValue: { queryParamMap: query } },
      { provide: ReferenceService, useValue: { data: signal({ countries: [], departments: [], jobTitles: [], fxRatesAsOf: '2026-10-01' }) } },
    ],
  });
  return TestBed.inject(HttpTestingController);
}

function respond(http: HttpTestingController, content: PayOutlier[]) {
  const request = http.expectOne((r) => r.url === '/api/v1/insights/outliers');
  request.flush({ success: true, data: { content, page: 0, size: 25, totalElements: content.length, totalPages: 1 } });
  return request.request;
}

describe('OutliersPage', () => {
  it('states direction in words, not only colour', async () => {
    const http = await renderPage();
    respond(http, [outlier(1, 'James Smith', 100.9), outlier(2, 'Robert Hall', -50.2)]);

    const above = await screen.findByRole('row', { name: /James Smith/ });
    expect(within(above).getByText(/\+100\.9%/)).toBeInTheDocument();
    expect(within(above).getByText(/above the peer median/)).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /Robert Hall/ })).getByText(/below the peer median/)).toBeInTheDocument();
  });

  it('queries with the filters from the URL', async () => {
    const http = await renderPage('threshold=50&country=IN');

    const request = respond(http, []);

    expect(await screen.findByText('No outliers at this threshold')).toBeInTheDocument();
    expect(request.params.get('threshold')).toBe('50');
    expect(request.params.get('country')).toBe('IN');
    expect(request.params.has('jobTitleId')).toBe(false);
    expect(request.params.get('page')).toBe('0');
  });

  it('links each person to their record', async () => {
    const http = await renderPage();
    respond(http, [outlier(9405, 'James Smith', 100.9)]);

    expect(await screen.findByRole('link', { name: 'James Smith' })).toHaveAttribute('href', '/employees/9405');
  });
});
