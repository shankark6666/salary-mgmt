import type { Metadata } from "next";
import { Suspense } from "react";
import { EmployeeDirectory } from "@modules/employees/components/EmployeeDirectory";

export const metadata: Metadata = { title: "Employees" };

export default function EmployeesPage() {
  return (
    <Suspense>
      <EmployeeDirectory />
    </Suspense>
  );
}
