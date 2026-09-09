export type PermissionAction = 'CREATE' | 'UPDATE' | 'READ' | 'DELETE';

export const PermissionActionValues = [
  'CREATE',
  'UPDATE',
  'READ',
  'DELETE',
] as const satisfies readonly PermissionAction[];
