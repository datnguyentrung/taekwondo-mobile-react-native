import type { AuthResponse } from '../api/auth.dto';
import { routeAfterAuthResponse } from './authRouting';

const response: AuthResponse = {
  accessToken: 'access',
  user: {
    userId: 'user-1',
    phoneNumber: '0369222068',
    status: 'ACTIVE',
    roles: ['ROLE_STUDENT'],
  },
  activeContext: null,
  availableContexts: [],
  requiresContextSelection: true,
};

describe('auth routing', () => {
  it('routes multi-context login to the native context group', () => {
    expect(routeAfterAuthResponse(response)).toBe('/(context)/select');
  });

  it('routes an active context to the protected app group', () => {
    expect(
      routeAfterAuthResponse({
        ...response,
        requiresContextSelection: false,
        activeContext: {
          personId: 'person-1',
          contextType: 'STUDENT',
          relationshipType: 'OWNER',
          userCode: 'HV001',
          displayName: 'Nguyễn Văn A',
        },
      }),
    ).toBe('/(app)');
  });
});
