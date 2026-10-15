"use client";

import { BarChart3, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useLogout } from "@modules/auth/hooks/useAuthActions";
import { useCurrentUser } from "@modules/auth/hooks/useCurrentUser";
import { Badge } from "@shared/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { Skeleton } from "@shared/components/ui/skeleton";
import { cn } from "@shared/utils/cn";

const NAV = [
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/employees", label: "Employees", icon: Users }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isPending, isError } = useCurrentUser();
  const logout = useLogout();

  useEffect(() => {
    if (isError) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isError, pathname, router]);

  if (isPending || isError) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-8" aria-busy="true">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const signOut = () => logout.mutate(undefined, { onSettled: () => router.replace("/login") });

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex shrink-0 flex-row items-center gap-2 border-b border-border bg-card px-4 py-3 md:w-60 md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-3 md:py-5">
        <p className="px-2 text-sm font-semibold text-primary md:mb-6">ACME Salary</p>
        <nav aria-label="Main" className="flex flex-1 flex-row gap-1 md:flex-col">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                  active ? "bg-accent font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2 md:flex-col md:items-stretch md:gap-3 md:border-t md:border-border md:pt-4">
          <div className="hidden px-2 md:block">
            <p className="truncate text-sm font-medium">{user.displayName}</p>
            <Badge className="mt-1">{user.role === "HR_MANAGER" ? "Manager" : "Analyst · read-only"}</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} disabled={logout.isPending} className="md:justify-start">
            <LogOut className="h-4 w-4" aria-hidden />
            Sign out
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
