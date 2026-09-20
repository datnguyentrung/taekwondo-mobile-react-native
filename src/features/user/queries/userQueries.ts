import { useQuery } from "@tanstack/react-query";

import { userRoleApi } from "@/features/roles";
import type { UserListParams } from "../api/user.dto";
import { userApi } from "../api/userApi";

export const USER_ADMIN_PAGE_SIZE = 200;

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params?: UserListParams) =>
    [...userKeys.lists(), { size: USER_ADMIN_PAGE_SIZE, ...params }] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
  roles: ["users", "roles"] as const,
};

export function useUsers(params?: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () =>
      userApi.list({
        size: USER_ADMIN_PAGE_SIZE,
        sort: "createdAt,desc",
        ...params,
      }),
    staleTime: 30_000,
  });
}

export function useUser(id?: string) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ""),
    queryFn: () => userApi.get(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useUserRoles() {
  return useQuery({
    queryKey: userKeys.roles,
    queryFn: () => userRoleApi.list({ size: USER_ADMIN_PAGE_SIZE }),
    staleTime: 30_000,
  });
}
