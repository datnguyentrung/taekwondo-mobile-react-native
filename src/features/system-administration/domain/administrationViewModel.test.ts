import { containsSearch, groupPermissions, permissionCodesForRole, roleCodesForUser } from './administrationViewModel';

describe('administrationViewModel', () => {
  it('filters Vietnamese administration records case-insensitively', () => {
    expect(containsSearch('quản', 'Quản trị viên')).toBe(true);
    expect(containsSearch('coach', 'Quản trị viên')).toBe(false);
  });

  it('groups permissions and resolves assignments', () => {
    const permissions = [
      { permissionId: 1, code: 'USER_READ', model: 'USER', action: 'READ' as const },
      { permissionId: 2, code: 'ROLE_READ', model: 'ROLE', action: 'READ' as const },
    ];
    expect(Object.keys(groupPermissions(permissions))).toEqual(['USER', 'ROLE']);
    expect(permissionCodesForRole('ADMIN', [{ roleCode: 'ADMIN', permissionId: 1, permissionCode: 'USER_READ' }])).toEqual(['USER_READ']);
    expect(roleCodesForUser('u1', [{ userId: 'u1', roleCode: 'ADMIN' }])).toEqual(['ADMIN']);
  });
});
