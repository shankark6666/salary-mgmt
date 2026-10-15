import { useQuery } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";

export const currentUserKey = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserKey,
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60_000
  });
}
