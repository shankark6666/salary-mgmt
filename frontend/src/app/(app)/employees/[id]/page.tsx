import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EmployeeDetail } from "@modules/employees/components/EmployeeDetail";

export const metadata: Metadata = { title: "Employee" };

export default async function EmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,18}$/.test(id)) notFound();
  return <EmployeeDetail id={Number(id)} />;
}
