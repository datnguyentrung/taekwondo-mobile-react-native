/** Shared session concepts; platform stores and UI state remain in each app. */
export type AuthTokens = { accessToken: string; refreshToken: string };

export type AuthStatus =
  | "bootstrapping"
  | "anonymous"
  | "selecting-context"
  | "authenticated"
  | "recoverable-error";
