import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import type { ApiEnvelope } from '../../../core/api/api.types';
import type {
  ChangeSalaryInput, CreateEmployeeInput, DirectoryQuery, Employee, UpdateEmployeeInput,
} from './employee.types';

const BASE = '/api/v1/employees';

/** Query parameters for the directory endpoint; empty filters are omitted. */
export function directoryParams(query: DirectoryQuery): Record<string, string | number> {
  const params: Record<string, string | number> = {
    status: query.status, page: query.page, size: query.size, sort: query.sort, direction: query.direction,
  };
  if (query.q.trim()) params['q'] = query.q.trim();
  if (query.country) params['country'] = query.country;
  if (query.departmentId) params['departmentId'] = query.departmentId;
  if (query.jobTitleId) params['jobTitleId'] = query.jobTitleId;
  return params;
}

/** Writes. Reads are reactive resources in the pages that show them. */
@Injectable({ providedIn: 'root' })
export class EmployeeApi {
  private readonly http = inject(HttpClient);

  create(input: CreateEmployeeInput): Promise<Employee> {
    return this.send(this.http.post<ApiEnvelope<Employee>>(BASE, input));
  }

  update(id: number, input: UpdateEmployeeInput): Promise<Employee> {
    return this.send(this.http.put<ApiEnvelope<Employee>>(`${BASE}/${id}`, input));
  }

  changeSalary(id: number, input: ChangeSalaryInput): Promise<Employee> {
    return this.send(this.http.post<ApiEnvelope<Employee>>(`${BASE}/${id}/salary-changes`, input));
  }

  deactivate(id: number): Promise<Employee> {
    return this.send(this.http.post<ApiEnvelope<Employee>>(`${BASE}/${id}/deactivate`, null));
  }

  private send(request: ReturnType<HttpClient['post']>): Promise<Employee> {
    return firstValueFrom(request.pipe(map((response) => (response as ApiEnvelope<Employee>).data as Employee)));
  }
}
