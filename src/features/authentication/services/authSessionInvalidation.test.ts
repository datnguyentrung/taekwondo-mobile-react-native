/* eslint-disable import/first -- mocks must be registered before module imports. */

jest.mock('@/infrastructure/notifications/notificationService', () => ({
  notificationService: {
    platform: 'ANDROID',
    cleanup: jest.fn().mockResolvedValue(undefined),
    getToken: jest.fn(),
  },
}));

jest.mock('../api/authApi', () => ({
  authApi: { updateFcm: jest.fn() },
}));

jest.mock('@/infrastructure/query/queryClient', () => ({
  queryClient: { clear: jest.fn() },
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'when-unlocked-this-device-only',
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import { authSessionService } from './authSessionService';
import { useNotificationStore } from '@/features/notification/store/notification.store';
import { useAuthStore } from '../store/auth.store';

const { notificationService: mockNotificationService } = jest.requireMock(
  '@/infrastructure/notifications/notificationService',
) as {
  notificationService: {
    platform: 'ANDROID' | 'IOS';
    cleanup: jest.Mock;
    getToken: jest.Mock;
  };
};
const { authApi: mockAuthApi } = jest.requireMock('../api/authApi') as {
  authApi: { updateFcm: jest.Mock };
};

describe('session invalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNotificationService.platform = 'ANDROID';
    mockNotificationService.getToken.mockReset();
    mockNotificationService.cleanup.mockResolvedValue(undefined);
    mockAuthApi.updateFcm.mockResolvedValue(undefined);
    useAuthStore.setState({ accessToken: 'access-token', status: 'authenticated' });
  });

  afterEach(async () => {
    await authSessionService.invalidateSession('refresh-rejected');
  });

  it('clears the notification store when a session is invalidated', async () => {
    useNotificationStore.setState({
      unreadCount: 12,
      hasFetched: true,
      lastActivePersonId: 'person-old',
    });

    await authSessionService.invalidateSession('logout');

    const state = useNotificationStore.getState();
    expect(state.unreadCount).toBe(0);
    expect(state.hasFetched).toBe(false);
    expect(state.lastActivePersonId).toBeNull();
  });

  it('serializes Android token updates and keeps the newest refresh token', async () => {
    await Promise.all([
      authSessionService.syncFcm({ token: 'token-old' }),
      authSessionService.syncFcm({ token: 'token-new' }),
    ]);

    expect(mockAuthApi.updateFcm).toHaveBeenNthCalledWith(1, 'token-old', 'ANDROID');
    expect(mockAuthApi.updateFcm).toHaveBeenNthCalledWith(2, 'token-new', 'ANDROID');
  });

  it('does not mark a failed token update as synchronized', async () => {
    mockAuthApi.updateFcm.mockRejectedValueOnce(new Error('offline'));

    await expect(authSessionService.syncFcm({ token: 'retry-token' })).rejects.toThrow('offline');
    await authSessionService.syncFcm({ token: 'retry-token' });

    expect(mockAuthApi.updateFcm).toHaveBeenCalledTimes(2);
  });

  it('does not synchronize FCM outside Android', async () => {
    mockNotificationService.platform = 'IOS';

    await authSessionService.syncFcm({ token: 'ios-token' });

    expect(mockAuthApi.updateFcm).not.toHaveBeenCalled();
  });
});
