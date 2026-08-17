import { deriveAuthStatus } from './deriveAuthStatus';
import type { AuthUser, UserContext } from './auth.types';

const user: AuthUser = {
  userId: 'user-1',
  phoneNumber: '0369222068',
  status: 'ACTIVE',
  roles: ['ROLE_STUDENT'],
};

const context: UserContext = {
  personId: 'person-1',
  contextType: 'STUDENT',
  relationshipType: 'OWNER',
  userCode: 'HV001',
  displayName: 'Nguyễn Văn A',
};

it('derives anonymous, context selection and authenticated states with web parity', () => {
  expect(deriveAuthStatus(null, null, null, false)).toBe('anonymous');
  expect(deriveAuthStatus('token', user, null, true)).toBe('selecting-context');
  expect(deriveAuthStatus('token', user, context, false)).toBe('authenticated');
});
