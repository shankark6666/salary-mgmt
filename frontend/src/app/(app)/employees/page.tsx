import type { Metadata } from "next";
import { PageHeader } from "@shared/components/layout/PageHeader";
import { EmptyState } from "@shared/components/feedback/EmptyState";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return (
    <>
      <PageHeader title="Employees" description="Directory and salary records." />
      <EmptyState title="Directory coming next" />
    </>
  );
}
