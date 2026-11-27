import type { AuthStatus, AuthUser, TenantInfo, UserContext } from './auth.types';

export function deriveAuthStatus(
  accessToken: string | null,
  user: AuthUser | null,
  activeContext: UserContext | null,
  requiresContextSelection: boolean,
  activeTenant: TenantInfo | null = null,
  requiresTenantSelection = false,
): Exclude<AuthStatus, 'bootstrapping' | 'recoverable-error'> {
  if (!accessToken || !user) return 'anonymous';
  if (requiresTenantSelection || !activeTenant) return 'selecting-tenant';
  if (requiresContextSelection || !activeContext) return 'selecting-context';
  return 'authenticated';
}
