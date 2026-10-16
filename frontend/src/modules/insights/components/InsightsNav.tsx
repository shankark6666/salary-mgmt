"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@shared/utils/cn";

const TABS = [
  { href: "/insights", label: "Overview" },
  { href: "/insights/countries", label: "By country" },
  { href: "/insights/roles", label: "Role comparison" },
  { href: "/insights/outliers", label: "Outliers" }
];

export function InsightsNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Insights" className="mb-6 flex gap-1 overflow-x-auto border-b border-border">
      {TABS.map(({ href, label }) => {
        const active = href === "/insights" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm",
              active ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
