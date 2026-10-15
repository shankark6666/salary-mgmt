"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@shared/components/ui/button";
import { Field } from "@shared/components/ui/field";
import { Input } from "@shared/components/ui/input";
import { useLogin } from "../hooks/useAuthActions";
import { safeNextPath } from "../safeNextPath";

const schema = z.object({
  username: z.string().trim().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password")
});

type LoginValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit((values) =>
    login.mutate(values, {
      onSuccess: () => router.replace(safeNextPath(searchParams.get("next")))
    })
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Field label="Username" error={errors.username?.message}>
        <Input autoComplete="username" autoFocus {...register("username")} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...register("password")} />
      </Field>
      {login.isError ? (
        <p role="alert" className="rounded-md bg-destructive-muted px-3 py-2 text-sm text-destructive-muted-foreground">
          {login.error.message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
