import { ensureCsrfToken, request } from "@shared/api/client";
import type { CurrentUser } from "../types/auth.types";

export const authApi = {
  me: () => request<CurrentUser>({ url: "/api/v1/auth/me" }),

  async login(username: string, password: string) {
    await ensureCsrfToken();
    return request<CurrentUser>({ url: "/api/v1/auth/login", method: "POST", data: { username, password } });
  },

  logout: () => request<void>({ url: "/api/v1/auth/logout", method: "POST" })
};
