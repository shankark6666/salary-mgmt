import type { Metadata } from "next";
import { PageHeader } from "@shared/components/layout/PageHeader";
import { EmptyState } from "@shared/components/feedback/EmptyState";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return (
    <>
      <PageHeader title="Insights" description="How ACME pays people." />
      <EmptyState title="Dashboard coming next" description="Pay by country, role comparisons, distributions and outliers." />
    </>
  );
}
