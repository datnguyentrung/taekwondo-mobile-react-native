import { createJavaApi, type AuthHttpRuntime } from "@tkd/api-client";

import { env } from "../../config/env";

export type { AuthHttpRuntime };

const javaApiRuntime = createJavaApi({
  baseURL: env.javaApiUrl,
  timeoutMs: env.apiTimeoutMs,
});

export const javaApi = javaApiRuntime.client;
export const configureAuthHttp = javaApiRuntime.configureAuth;
