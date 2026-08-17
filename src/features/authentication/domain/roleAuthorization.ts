export function normalizeRole(role: string): string {
  return role.startsWith('ROLE_') ? role : `ROLE_${role}`;
}

export function hasRole(roles: readonly string[] | undefined, role: string): boolean {
  const requiredRole = normalizeRole(role);
  return Boolean(
    roles?.some((currentRole) => normalizeRole(currentRole) === requiredRole),
  );
}

export function hasAnyRole(
  roles: readonly string[] | undefined,
  requiredRoles: readonly string[],
): boolean {
  return requiredRoles.some((role) => hasRole(roles, role));
}

export function isManager(roles: readonly string[] | undefined): boolean {
  return Boolean(
    roles?.some(
      (role) => role.includes('MANAGER') || role.includes('HEAD_COACH'),
    ),
  );
}
