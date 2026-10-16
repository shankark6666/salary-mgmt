import type { Metadata } from "next";
import { Suspense } from "react";
import { RoleComparison } from "@modules/insights/components/RoleComparison";

export const metadata: Metadata = { title: "Role comparison" };

export default function Page() {
  return (
    <Suspense>
      <RoleComparison />
    </Suspense>
  );
}
