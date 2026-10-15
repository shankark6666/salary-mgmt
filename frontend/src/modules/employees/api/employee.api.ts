import { request } from "@shared/api/client";
import type { Page } from "@shared/types/api.types";
import type {
  ChangeSalaryInput,
  CreateEmployeeInput,
  DirectoryQuery,
  Employee,
  SalaryHistoryEntry,
  UpdateEmployeeInput
} from "../types/employee.types";

const BASE = "/api/v1/employees";

export const employeeApi = {
  search: (query: DirectoryQuery) =>
    request<Page<Employee>>({
      url: BASE,
      params: {
        q: query.q.trim() || undefined,
        country: query.country ?? undefined,
        departmentId: query.departmentId ?? undefined,
        jobTitleId: query.jobTitleId ?? undefined,
        status: query.status,
        page: query.page,
        size: query.size,
        sort: query.sort,
        direction: query.direction
      }
    }),
  get: (id: number) => request<Employee>({ url: `${BASE}/${id}` }),
  history: (id: number) => request<SalaryHistoryEntry[]>({ url: `${BASE}/${id}/salary-history` }),
  create: (input: CreateEmployeeInput) => request<Employee>({ url: BASE, method: "POST", data: input }),
  update: (id: number, input: UpdateEmployeeInput) =>
    request<Employee>({ url: `${BASE}/${id}`, method: "PUT", data: input }),
  changeSalary: (id: number, input: ChangeSalaryInput) =>
    request<Employee>({ url: `${BASE}/${id}/salary-changes`, method: "POST", data: input }),
  deactivate: (id: number) => request<Employee>({ url: `${BASE}/${id}/deactivate`, method: "POST" })
};
