import type { ReactNode } from "react";
import { InsightsNav } from "@modules/insights/components/InsightsNav";
import { PageHeader } from "@shared/components/layout/PageHeader";

export default function InsightsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="Insights" description="How ACME pays people. Active employees only." />
      <InsightsNav />
      {children}
    </>
  );
}
