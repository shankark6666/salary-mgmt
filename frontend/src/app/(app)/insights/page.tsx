import type { Metadata } from "next";
import { InsightsOverview } from "@modules/insights/components/InsightsOverview";

export const metadata: Metadata = { title: "Insights" };

export default function InsightsPage() {
  return <InsightsOverview />;
}
