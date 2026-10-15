import axios, { type AxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "@shared/types/api.types";
import { toApiError } from "./errors";

/**
 * Every call is same-origin (/api/... is proxied by Next.js), so the browser attaches the
 * HttpOnly session cookie by itself and the app never touches credentials.
 *
 * CSRF: the backend sets a readable XSRF-TOKEN cookie; axios echoes it in X-XSRF-TOKEN on
 * same-origin requests. If the token has expired the call is retried once with a fresh one.
 */
export const http = axios.create({
  headers: { Accept: "application/json" },
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  withXSRFToken: true,
  timeout: 20_000
});

export async function ensureCsrfToken() {
  await http.get("/api/v1/auth/csrf");
}

type Retriable = AxiosRequestConfig & { _csrfRetried?: boolean };

http.interceptors.response.use(undefined, async (error) => {
  const config = error.config as Retriable | undefined;
  const code = error.response?.data?.errorCode;
  if (config && code === "CSRF_INVALID" && !config._csrfRetried) {
    config._csrfRetried = true;
    await ensureCsrfToken();
    return http.request(config);
  }
  if (
    error.response?.status === 401 &&
    typeof window !== "undefined" &&
    !config?.url?.startsWith("/api/v1/auth/")
  ) {
    // Session expired mid-use: back to sign-in, then return here.
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.assign(`/login?next=${next}`);
  }
  return Promise.reject(toApiError(error));
});

/** Unwraps the envelope, so callers get data or an ApiError. */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<ApiEnvelope<T>>(config);
  return response.data.data as T;
}
