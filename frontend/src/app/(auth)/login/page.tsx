import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@modules/auth/components/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/components/ui/card";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-sm shadow-sm">
        <CardHeader>
          <p className="text-sm font-semibold text-primary">ACME Salary</p>
          <CardTitle className="text-xl">Sign in</CardTitle>
          <CardDescription>Use your HR account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
