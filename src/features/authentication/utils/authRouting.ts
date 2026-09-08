import type { AuthResponse } from '../api/auth.dto';

export type AuthDestination =
  | '/(auth)/login'
  | '/(context)/select'
  | '/';

export function routeAfterAuthResponse(response: AuthResponse): AuthDestination {
  return response.requiresContextSelection || !response.activeContext
    ? '/(context)/select'
    : '/';
}
