import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { currentUserKey } from "./useCurrentUser";

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authApi.login(username, password),
    onSuccess: (user) => queryClient.setQueryData(currentUserKey, user)
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    // Drop every cached salary figure, not just the user: the next person at this browser
    // must not see the previous session's data.
    onSettled: () => queryClient.clear()
  });
}
