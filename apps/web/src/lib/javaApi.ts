import { createJavaApi } from '@tkd/api-client'

const baseURL = import.meta.env.VITE_API_URL ?? '/api/v1'

export const javaApi = createJavaApi({
  baseURL,
  timeoutMs: 20_000,
  withCredentials: true,
  isAuthLifecycleRequest: (url) => /\/auth\/(login|refresh|logout)$/.test(url),
})
