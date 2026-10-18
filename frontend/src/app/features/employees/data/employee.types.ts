export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACTOR";
export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "ALL";
export type SortField =
  | "name"
  | "employeeCode"
  | "email"
  | "country"
  | "department"
  | "jobTitle"
  | "hireDate"
  | "salaryUsd";
export type SortDirection = "ASC" | "DESC";

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACTOR: "Contractor"
};

export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  email: string;
  countryCode: string;
  countryName: string;
  currencyCode: string;
  departmentId: number;
  departmentName: string;
  jobTitleId: number;
  jobTitleName: string;
  employmentType: EmploymentType;
  hireDate: string;
  salary: number;
  salaryUsd: number;
  active: boolean;
  version: number;
}

export interface SalaryHistoryEntry {
  id: number;
  previousSalary: number | null;
  newSalary: number;
  effectiveDate: string;
  reason: string;
  changedBy: string;
  recordedAt: string;
}

export interface DirectoryQuery {
  q: string;
  country: string | null;
  departmentId: number | null;
  jobTitleId: number | null;
  status: EmployeeStatus;
  page: number;
  size: number;
  sort: SortField;
  direction: SortDirection;
}

export interface CreateEmployeeInput {
  fullName: string;
  email: string;
  countryCode: string;
  departmentId: number;
  jobTitleId: number;
  employmentType: EmploymentType;
  hireDate: string;
  salary: number;
}

export interface UpdateEmployeeInput {
  version: number;
  fullName: string;
  email: string;
  departmentId: number;
  jobTitleId: number;
  employmentType: EmploymentType;
}

export interface ChangeSalaryInput {
  version: number;
  newSalary: number;
  effectiveDate: string;
  reason: string;
}
