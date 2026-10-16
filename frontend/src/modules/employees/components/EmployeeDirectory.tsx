"use client";

import { Download, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { canWrite } from "@modules/auth/types/auth.types";
import { useCurrentUser } from "@modules/auth/hooks/useCurrentUser";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { PageHeader } from "@shared/components/layout/PageHeader";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import { Pager } from "@shared/components/ui/pager";
import { useEmployeeDirectory } from "../hooks/useEmployees";
import { exportHref, nextSort, parseDirectoryQuery, toSearchParams } from "../lib/directoryQuery";
import type { DirectoryQuery } from "../types/employee.types";
import { CreateEmployeeDialog } from "./CreateEmployeeDialog";
import { DirectoryFilters } from "./DirectoryFilters";
import { EmployeeTable } from "./EmployeeTable";

export function EmployeeDirectory() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = parseDirectoryQuery(searchParams);
  const { data: user } = useCurrentUser();
  const { data, isPending, isError, error, refetch, isFetching } = useEmployeeDirectory(query);
  const [creating, setCreating] = useState(false);

  const update = (patch: Partial<DirectoryQuery>) => {
    const params = toSearchParams({ ...query, ...patch }).toString();
    router.replace(params ? `${pathname}?${params}` : pathname, { scroll: false });
  };

  return (
    <>
      <PageHeader
        title="Employees"
        description="Salaries in local currency; ≈ shows the US dollar equivalent used for comparison."
        actions={
          canWrite(user) ? (
            <>
              {/* Managers only: bulk export is restricted (and audited) on the server too. */}
              <a
                href={exportHref(query)}
                download
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-secondary px-4 text-sm font-medium text-secondary-foreground hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Download className="h-4 w-4" aria-hidden />
                Export CSV
              </a>
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Add employee
              </Button>
            </>
          ) : null
        }
      />
      <Card>
        <CardContent className="space-y-4 pt-5">
          <DirectoryFilters query={query} onChange={update} />
          {isError ? (
            <ErrorState message={error.message} onRetry={() => refetch()} />
          ) : data && data.totalElements === 0 ? (
            <EmptyState title="No employees match" description="Try a different search or clear the filters." />
          ) : (
            <div className={isFetching && !isPending ? "opacity-60 transition-opacity" : undefined}>
              <EmployeeTable
                employees={data?.content}
                loading={isPending}
                sort={query.sort}
                direction={query.direction}
                onSort={(field) => update({ ...nextSort(query, field), page: 0 })}
                showStatus={query.status !== "ACTIVE"}
              />
              {data ? (
                <Pager
                  page={data.page}
                  size={data.size}
                  totalElements={data.totalElements}
                  totalPages={data.totalPages}
                  onPageChange={(page) => update({ page })}
                />
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
      {canWrite(user) ? <CreateEmployeeDialog open={creating} onClose={() => setCreating(false)} /> : null}
    </>
  );
}
