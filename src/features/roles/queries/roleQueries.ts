import { useQuery } from "@tanstack/react-query";

import { roleApi } from "../api/roleApi";
import { rolePermissionApi } from "../api/rolePermissionApi";

export const ROLE_ADMIN_PAGE_SIZE = 200;

export const roleKeys = {
  all: ["roles"] as const,
  lists: () => [...roleKeys.all, "list"] as const,
  list: () => [...roleKeys.lists(), { size: ROLE_ADMIN_PAGE_SIZE }] as const,
  detail: (code: string) => [...roleKeys.all, "detail", code] as const,
  permissions: ["roles", "permissions"] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () =>
      roleApi.list({ size: ROLE_ADMIN_PAGE_SIZE, sort: "name,asc" }),
    staleTime: 30_000,
  });
}

export function useRole(code?: string) {
  return useQuery({
    queryKey: roleKeys.detail(code ?? ""),
    queryFn: () => roleApi.get(code as string),
    enabled: Boolean(code),
    staleTime: 30_000,
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: roleKeys.permissions,
    queryFn: () => rolePermissionApi.list({ size: ROLE_ADMIN_PAGE_SIZE }),
    staleTime: 30_000,
  });
}
