import { create, isAxiosError, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import axiosRetry, { exponentialDelay, isNetworkError } from "axios-retry";

type RetriableRequest = InternalAxiosRequestConfig & { _authRetried?: boolean };

export type AuthHttpRuntime = {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string>;
  invalidateSession: () => Promise<void>;
};

export function createJavaApi(options: {
  baseURL: string;
  timeoutMs: number;
  /** Required by browser clients that refresh sessions through an HttpOnly cookie. */
  withCredentials?: boolean;
  /** Lets each platform describe its own login/refresh/logout endpoints. */
  isAuthLifecycleRequest?: (url: string) => boolean;
}) {
  let authRuntime: AuthHttpRuntime | null = null;
  let refreshPromise: Promise<string> | null = null;
  const client = create({
    baseURL: options.baseURL,
    timeout: options.timeoutMs,
    withCredentials: options.withCredentials ?? false,
    headers: { Accept: "application/json", "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
    paramsSerializer: { indexes: null },
  });
  const isAuthLifecycleRequest = options.isAuthLifecycleRequest ??
    ((url: string) => /\/auth\/mobile\/(login|refresh|logout)/.test(url));
  const refresh = (runtime: AuthHttpRuntime) => {
    if (!refreshPromise) refreshPromise = runtime.refreshAccessToken().catch(async (error: unknown) => {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 401 || status === 403) await runtime.invalidateSession();
      throw error;
    }).finally(() => { refreshPromise = null; });
    return refreshPromise;
  };
  axiosRetry(client, {
    retries: 3, retryDelay: exponentialDelay,
    retryCondition: (error: AxiosError) => {
      const method = error.config?.method?.toLowerCase();
      const status = error.response?.status;
      return (method === "get" || method === "head") && (isNetworkError(error) || status === 429 || Boolean(status && status >= 500));
    },
  });
  client.interceptors.request.use((config) => {
    if (config.data instanceof FormData) config.headers.delete("Content-Type");
    const token = authRuntime?.getAccessToken();
    if (token && !isAuthLifecycleRequest(config.url ?? "")) config.headers.set("Authorization", `Bearer ${token}`);
    return config;
  });
  client.interceptors.response.use(undefined, async (error: unknown) => {
    if (!isAxiosError(error) || !error.config) throw error;
    const request = error.config as RetriableRequest;
    const runtime = authRuntime;
    if (error.response?.status !== 401 || request._authRetried || isAuthLifecycleRequest(request.url ?? "") || !runtime) throw error;
    request._authRetried = true;
    request.headers.set("Authorization", `Bearer ${await refresh(runtime)}`);
    return client(request);
  });
  return {
    client,
    configureAuth(runtime: AuthHttpRuntime) {
      authRuntime = runtime;
      return () => { if (authRuntime === runtime) authRuntime = null; };
    },
  };
}
