import type { AuthResponse } from '../api/auth.dto';

export type AuthDestination =
  | '/(auth)/login'
  | '/(context)/select'
  | '/(app)/(tabs)';

export function routeAfterAuthResponse(response: AuthResponse): AuthDestination {
  if (response.requiresTenantSelection || !response.activeTenant) {
    return '/(context)/select';
  }
  return response.requiresContextSelection || !response.activeContext
    ? '/(context)/select'
    : '/(app)/(tabs)';
}
