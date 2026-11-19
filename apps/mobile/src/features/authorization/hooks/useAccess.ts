import { useAuthStore } from "../../authentication/store/auth.store";
import { canAll, canAny, hasPermission } from "../domain/access";
import type { PermissionValue } from "../domain/permissions";

export function usePermissions(): readonly PermissionValue[] | undefined {
  return useAuthStore((state) => state.user?.permissions);
}

export function useCan(permission: PermissionValue): boolean {
  const permissions = usePermissions();
  return hasPermission(permissions, permission);
}

export function useCanAny(
  requiredPermissions: readonly PermissionValue[],
): boolean {
  const permissions = usePermissions();
  return canAny(permissions, requiredPermissions);
}

export function useCanAll(
  requiredPermissions: readonly PermissionValue[],
): boolean {
  const permissions = usePermissions();
  return canAll(permissions, requiredPermissions);
}
