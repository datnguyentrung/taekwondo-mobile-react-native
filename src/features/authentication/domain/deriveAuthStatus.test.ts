import { deriveAuthStatus } from './deriveAuthStatus';
import type { AuthUser, TenantInfo, UserContext } from './auth.types';

const user: AuthUser = {
  userId: 'user-1',
  phoneNumber: '0369222068',
  status: 'ACTIVE',
  roles: ['ROLE_STUDENT'],
  permissions: [],
};

const tenant: TenantInfo = {
  tenantId: 'tenant-1',
  code: 'VAN_QUAN',
  name: 'Taekwondo Văn Quán',
  status: 'ACTIVE',
};

const context: UserContext = {
  userPersonId: 'user-person-1',
  personId: 'person-1',
  relationshipType: 'OWNER',
  personCode: 'HV001',
  displayName: 'NGUYỄN VĂN A',
  gender: true,
};

it('derives anonymous, tenant selection, context selection and authenticated states', () => {
  expect(deriveAuthStatus(null, null, null, false)).toBe('anonymous');
  expect(deriveAuthStatus('token', user, null, false, null, true)).toBe('selecting-tenant');
  expect(deriveAuthStatus('token', user, null, true, tenant, false)).toBe('selecting-context');
  expect(deriveAuthStatus('token', user, context, false, tenant, false)).toBe('authenticated');
});
