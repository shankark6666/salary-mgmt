"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useReferenceData } from "@modules/reference/hooks/useReferenceData";
import { Button } from "@shared/components/ui/button";
import { Input } from "@shared/components/ui/input";
import { Select } from "@shared/components/ui/select";
import { useDebouncedValue } from "@shared/hooks/useDebouncedValue";
import { DEFAULT_QUERY } from "../lib/directoryQuery";
import type { DirectoryQuery, EmployeeStatus } from "../types/employee.types";

interface Props {
  query: DirectoryQuery;
  onChange: (patch: Partial<DirectoryQuery>) => void;
}

const toId = (value: string) => (value ? Number(value) : null);

export function DirectoryFilters({ query, onChange }: Props) {
  const { data: reference } = useReferenceData();
  const [search, setSearch] = useState(query.q);
  const debouncedSearch = useDebouncedValue(search);

  // Search hits the server once typing pauses, not on every keystroke.
  useEffect(() => {
    if (debouncedSearch !== query.q) onChange({ q: debouncedSearch, page: 0 });
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the box in sync when the URL changes from elsewhere (back button, reset). Adjusting
  // state during render, rather than in an effect, avoids an extra render pass.
  const [syncedQuery, setSyncedQuery] = useState(query.q);
  if (query.q !== syncedQuery) {
    setSyncedQuery(query.q);
    setSearch(query.q);
  }

  const filtered =
    query.q !== "" || query.country !== null || query.departmentId !== null ||
    query.jobTitleId !== null || query.status !== DEFAULT_QUERY.status;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="relative w-full sm:min-w-[16rem] sm:flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          aria-label="Search by name, email or employee code"
          placeholder="Search name, email or code"
          value={search}
          maxLength={100}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
        />
      </div>
      <Select
        aria-label="Country"
        value={query.country ?? ""}
        onChange={(event) => onChange({ country: event.target.value || null, page: 0 })}
        className="w-full sm:w-auto"
      >
        <option value="">All countries</option>
        {reference?.countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Department"
        value={query.departmentId ?? ""}
        onChange={(event) => onChange({ departmentId: toId(event.target.value), page: 0 })}
        className="w-full sm:w-auto"
      >
        <option value="">All departments</option>
        {reference?.departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Job title"
        value={query.jobTitleId ?? ""}
        onChange={(event) => onChange({ jobTitleId: toId(event.target.value), page: 0 })}
        className="w-full sm:w-auto"
      >
        <option value="">All job titles</option>
        {reference?.jobTitles.map((title) => (
          <option key={title.id} value={title.id}>
            {title.name}
          </option>
        ))}
      </Select>
      <Select
        aria-label="Status"
        value={query.status}
        onChange={(event) => onChange({ status: event.target.value as EmployeeStatus, page: 0 })}
        className="w-full sm:w-auto"
      >
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="ALL">All statuses</option>
      </Select>
      {filtered ? (
        <Button variant="ghost" size="sm" onClick={() => onChange({ ...DEFAULT_QUERY, size: query.size })}>
          <X className="h-4 w-4" aria-hidden />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
