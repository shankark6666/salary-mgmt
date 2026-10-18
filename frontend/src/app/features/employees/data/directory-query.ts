import type { DirectoryQuery, EmployeeStatus, SortDirection, SortField } from "./employee.types";

/**
 * The directory's filters live in the URL, so a view can be bookmarked, shared and survives a
 * refresh or the back button. Anything malformed falls back to the default rather than erroring.
 */
export const DEFAULT_QUERY: DirectoryQuery = {
  q: "",
  country: null,
  departmentId: null,
  jobTitleId: null,
  status: "ACTIVE",
  page: 0,
  size: 25,
  sort: "name",
  direction: "ASC"
};

const SORT_FIELDS: readonly SortField[] = [
  "name", "employeeCode", "email", "country", "department", "jobTitle", "hireDate", "salaryUsd"
];
const STATUSES: readonly EmployeeStatus[] = ["ACTIVE", "INACTIVE", "ALL"];
const DIRECTIONS: readonly SortDirection[] = ["ASC", "DESC"];
const PAGE_SIZES = [25, 50, 100];

interface ParamSource {
  get(name: string): string | null;
}

function oneOf<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function positiveInt(value: string | null): number | null {
  if (value === null || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed > 0 && Number.isSafeInteger(parsed) ? parsed : null;
}

export function parseDirectoryQuery(params: ParamSource): DirectoryQuery {
  const country = params.get("country");
  const size = positiveInt(params.get("size"));
  return {
    q: (params.get("q") ?? "").slice(0, 100),
    country: country && /^[A-Z]{2}$/.test(country) ? country : null,
    departmentId: positiveInt(params.get("departmentId")),
    jobTitleId: positiveInt(params.get("jobTitleId")),
    status: oneOf(params.get("status"), STATUSES, DEFAULT_QUERY.status),
    page: Math.max(0, (positiveInt(params.get("page")) ?? 1) - 1),
    size: size !== null && PAGE_SIZES.includes(size) ? size : DEFAULT_QUERY.size,
    sort: oneOf(params.get("sort"), SORT_FIELDS, DEFAULT_QUERY.sort),
    direction: oneOf(params.get("direction"), DIRECTIONS, DEFAULT_QUERY.direction)
  };
}

/** Only non-default values are written, so URLs stay short. Pages are 1-based for humans. */
export function toSearchParams(query: DirectoryQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.q.trim()) params.set("q", query.q.trim());
  if (query.country) params.set("country", query.country);
  if (query.departmentId) params.set("departmentId", String(query.departmentId));
  if (query.jobTitleId) params.set("jobTitleId", String(query.jobTitleId));
  if (query.status !== DEFAULT_QUERY.status) params.set("status", query.status);
  if (query.page > 0) params.set("page", String(query.page + 1));
  if (query.size !== DEFAULT_QUERY.size) params.set("size", String(query.size));
  if (query.sort !== DEFAULT_QUERY.sort) params.set("sort", query.sort);
  if (query.direction !== DEFAULT_QUERY.direction) params.set("direction", query.direction);
  return params;
}

/** Clicking a sorted column flips it; a new column starts in its natural order. */
export function nextSort(query: DirectoryQuery, field: SortField): Pick<DirectoryQuery, "sort" | "direction"> {
  if (query.sort === field) {
    return { sort: field, direction: query.direction === "ASC" ? "DESC" : "ASC" };
  }
  const descendingFirst = field === "salaryUsd" || field === "hireDate";
  return { sort: field, direction: descendingFirst ? "DESC" : "ASC" };
}

/**
 * Same filters and order as the screen, without paging: HR exports exactly what they see.
 * A plain same-origin link, so the browser sends the session cookie and handles the download.
 */
export function exportHref(query: DirectoryQuery) {
  const params = toSearchParams({ ...query, page: 0, size: DEFAULT_QUERY.size });
  if (!params.has("status")) params.set("status", query.status);
  return `/api/v1/employees/export?${params.toString()}`;
}
