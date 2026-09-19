import { useQueries, useQuery } from '@tanstack/react-query';

import { personApi, userPersonApi } from '@/features/person';
import { positionApi } from '@/features/position';
import { permissionApi, roleApi, rolePermissionApi, userRoleApi } from '@/features/roles';
import { userApi } from '@/features/user';

export const ADMIN_PAGE_SIZE = 200;

export const administrationKeys = {
  all: ['system-administration'] as const,
  roles: ['system-administration', 'roles'] as const,
  role: (code: string) => ['system-administration', 'roles', code] as const,
  permissions: ['system-administration', 'permissions'] as const,
  permission: (id: number) => ['system-administration', 'permissions', id] as const,
  rolePermissions: ['system-administration', 'role-permissions'] as const,
  positions: ['system-administration', 'positions'] as const,
  position: (id: string) => ['system-administration', 'positions', id] as const,
  users: ['system-administration', 'users'] as const,
  user: (id: string) => ['system-administration', 'users', id] as const,
  userRoles: ['system-administration', 'user-roles'] as const,
  userPersons: ['system-administration', 'user-persons'] as const,
  people: ['system-administration', 'people'] as const,
  personDetails: ['system-administration', 'people', 'details'] as const,
};

export function useRoles() {
  return useQuery({ queryKey: administrationKeys.roles, queryFn: () => roleApi.list({ size: ADMIN_PAGE_SIZE, sort: 'name,asc' }), staleTime: 30_000 });
}

export function useRole(code?: string) {
  return useQuery({ queryKey: administrationKeys.role(code ?? ''), queryFn: () => roleApi.get(code as string), enabled: Boolean(code), staleTime: 30_000 });
}

export function usePermissionsCatalog() {
  return useQuery({ queryKey: administrationKeys.permissions, queryFn: () => permissionApi.list({ size: ADMIN_PAGE_SIZE, sort: ['model,asc', 'action,asc'] }), staleTime: 30_000 });
}

export function usePermission(id?: number) {
  return useQuery({ queryKey: administrationKeys.permission(id ?? 0), queryFn: () => permissionApi.get(id as number), enabled: Boolean(id), staleTime: 30_000 });
}

export function useRolePermissions() {
  return useQuery({ queryKey: administrationKeys.rolePermissions, queryFn: () => rolePermissionApi.list({ size: ADMIN_PAGE_SIZE }), staleTime: 30_000 });
}

export function usePositions() {
  return useQuery({ queryKey: administrationKeys.positions, queryFn: () => positionApi.list({ size: ADMIN_PAGE_SIZE, sort: 'name,asc' }), staleTime: 30_000 });
}

export function usePosition(id?: string) {
  return useQuery({ queryKey: administrationKeys.position(id ?? ''), queryFn: () => positionApi.get(id as string), enabled: Boolean(id), staleTime: 30_000 });
}

export function useUsers() {
  return useQuery({ queryKey: administrationKeys.users, queryFn: () => userApi.list({ size: ADMIN_PAGE_SIZE, sort: 'createdAt,desc' }), staleTime: 30_000 });
}

export function useUser(id?: string) {
  return useQuery({ queryKey: administrationKeys.user(id ?? ''), queryFn: () => userApi.get(id as string), enabled: Boolean(id), staleTime: 30_000 });
}

export function useUserRoles() {
  return useQuery({ queryKey: administrationKeys.userRoles, queryFn: () => userRoleApi.list({ size: ADMIN_PAGE_SIZE }), staleTime: 30_000 });
}

export function useUserPersons() {
  return useQuery({ queryKey: administrationKeys.userPersons, queryFn: () => userPersonApi.list({ size: ADMIN_PAGE_SIZE }), staleTime: 30_000 });
}

export function usePeople() {
  return useQuery({ queryKey: administrationKeys.people, queryFn: () => personApi.list({ size: ADMIN_PAGE_SIZE, sort: 'fullName,asc' }), staleTime: 30_000 });
}

export function usePositionPeople(positionId?: string) {
  const people = usePeople();
  const details = useQueries({
    queries: (people.data?.content ?? []).map((person) => ({
      queryKey: [...administrationKeys.personDetails, person.personId],
      queryFn: () => personApi.get(person.personId),
      enabled: Boolean(positionId),
      staleTime: 60_000,
    })),
  });
  return {
    people: details
      .map((query) => query.data)
      .filter((person): person is NonNullable<typeof person> => Boolean(person && person.position?.positionId === positionId)),
    isPending: people.isPending || details.some((query) => query.isPending),
    isError: people.isError || details.some((query) => query.isError),
  };
}
