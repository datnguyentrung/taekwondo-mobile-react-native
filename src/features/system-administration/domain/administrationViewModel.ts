import type { PermissionSimpleResponse, RolePermissionSimpleResponse, UserRoleSimpleResponse } from '@/features/roles';
import type { UserStatus } from '@/features/user';

export function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase('vi-VN');
}

export function containsSearch(search: string, ...values: (string | null | undefined)[]) {
  const needle = normalizeSearch(search);
  return !needle || values.some((value) => value?.toLocaleLowerCase('vi-VN').includes(needle));
}

export function groupPermissions(permissions: readonly PermissionSimpleResponse[]) {
  return permissions.reduce<Record<string, PermissionSimpleResponse[]>>((groups, permission) => {
    (groups[permission.model] ??= []).push(permission);
    return groups;
  }, {});
}

export function permissionCodesForRole(roleCode: string, assignments: readonly RolePermissionSimpleResponse[]) {
  return assignments.filter((item) => item.roleCode === roleCode).map((item) => item.permissionCode);
}

export function roleCodesForUser(userId: string, assignments: readonly UserRoleSimpleResponse[]) {
  return assignments.filter((item) => item.userId === userId).map((item) => item.roleCode);
}

export function initials(value?: string | null) {
  const parts = value?.trim().split(/\s+/).filter(Boolean) ?? [];
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0]}` : parts[0]?.slice(0, 2) ?? '?').toLocaleUpperCase('vi-VN');
}

export function userStatusLabel(status?: UserStatus | null) {
  switch (status) {
    case 'ACTIVE': return 'Hoạt động';
    case 'PENDING': return 'Chờ kích hoạt';
    case 'BANNED': return 'Đã khóa';
    case 'DEACTIVATED': return 'Vô hiệu hóa';
    default: return 'Chưa xác định';
  }
}

export function relationshipLabel(value?: string | null) {
  switch (value) {
    case 'OWNER': return 'Chính chủ';
    case 'GUARDIAN': return 'Phụ huynh / người giám hộ';
    case 'MANAGER': return 'Quản lý';
    default: return value ?? 'Chưa xác định';
  }
}

export function formatDateTime(value?: string | null) {
  if (!value) return 'Chưa có';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
