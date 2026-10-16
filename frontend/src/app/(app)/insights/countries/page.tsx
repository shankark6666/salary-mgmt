import type { Metadata } from "next";
import { Suspense } from "react";
import { CountryInsights } from "@modules/insights/components/CountryInsights";

export const metadata: Metadata = { title: "Pay by country" };

export default function CountryInsightsPage() {
  return (
    <Suspense>
      <CountryInsights />
    </Suspense>
  );
}
