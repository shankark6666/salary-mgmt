import type { Metadata } from "next";
import { Suspense } from "react";
import { OutlierList } from "@modules/insights/components/OutlierList";

export const metadata: Metadata = { title: "Pay outliers" };

export default function Page() {
  return (
    <Suspense>
      <OutlierList />
    </Suspense>
  );
}
