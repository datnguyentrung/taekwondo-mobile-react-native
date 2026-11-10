/* eslint-disable import/first -- mocks must be registered before module imports. */

const mockMessaging = {
  deleteToken: jest.fn(),
  getMessaging: jest.fn(() => ({ id: 'messaging' })),
  getToken: jest.fn(),
  onMessage: jest.fn(() => jest.fn()),
  onTokenRefresh: jest.fn(() => jest.fn()),
};

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: null },
  AppOwnership: { Expo: 'expo' },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 33 },
  PermissionsAndroid: {
    PERMISSIONS: { POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS' },
    RESULTS: { GRANTED: 'granted', DENIED: 'denied' },
    check: jest.fn(),
    request: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/messaging', () => mockMessaging);

import Constants from 'expo-constants';
import { PermissionsAndroid, Platform } from 'react-native';

import { notificationService } from './notificationService.native';

const mockPermissions = PermissionsAndroid as unknown as {
  check: jest.Mock;
  request: jest.Mock;
};

describe('native notification adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Constants as unknown as { appOwnership: unknown }).appOwnership = null;
    const mockPlatform = Platform as unknown as { OS: string; Version: number };
    mockPlatform.OS = 'android';
    mockPlatform.Version = 33;
  });

  it('does not access Firebase in Expo Go', async () => {
    (Constants as unknown as { appOwnership: unknown }).appOwnership = 'expo';

    await expect(notificationService.getToken({ requestPermission: false })).resolves.toBeNull();
    await expect(notificationService.getToken({ requestPermission: true })).resolves.toBeNull();

    expect(mockMessaging.getToken).not.toHaveBeenCalled();
    expect(mockPermissions.request).not.toHaveBeenCalled();
  });

  it('gets a token on Android below API 33 without a runtime permission request', async () => {
    (Platform as unknown as { Version: number }).Version = 32;
    mockMessaging.getToken.mockResolvedValueOnce('fcm-token');

    await expect(notificationService.getToken({ requestPermission: true })).resolves.toBe('fcm-token');

    expect(mockPermissions.check).not.toHaveBeenCalled();
    expect(mockPermissions.request).not.toHaveBeenCalled();
    expect(mockMessaging.getToken).toHaveBeenCalledWith({ id: 'messaging' });
  });

  it('gets a token only after Android 13 notification permission is granted', async () => {
    mockPermissions.request.mockResolvedValueOnce('granted');
    mockMessaging.getToken.mockResolvedValueOnce('fcm-token');

    await expect(notificationService.getToken({ requestPermission: true })).resolves.toBe('fcm-token');

    expect(mockPermissions.request).toHaveBeenCalledWith(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    expect(mockMessaging.getToken).toHaveBeenCalledTimes(1);
  });

  it('does not get a token when Android 13 permission is denied', async () => {
    mockPermissions.request.mockResolvedValueOnce('denied');

    await expect(notificationService.getToken({ requestPermission: true })).resolves.toBeNull();

    expect(mockMessaging.getToken).not.toHaveBeenCalled();
  });

  it('wires token refresh and deletes the Android token during cleanup', async () => {
    const listener = jest.fn();
    const unsubscribe = jest.fn();
    mockMessaging.onTokenRefresh.mockReturnValueOnce(unsubscribe);

    expect(notificationService.subscribeToTokenRefresh(listener)).toBe(unsubscribe);
    expect(mockMessaging.onTokenRefresh).toHaveBeenCalledWith({ id: 'messaging' }, listener);

    await notificationService.cleanup();
    expect(mockMessaging.deleteToken).toHaveBeenCalledWith({ id: 'messaging' });
  });

  it('does not delete a token outside Android', async () => {
    (Platform as unknown as { OS: string }).OS = 'ios';

    await expect(notificationService.getToken({ requestPermission: true })).resolves.toBeNull();
    expect(notificationService.subscribeToTokenRefresh(jest.fn())).toEqual(expect.any(Function));
    await notificationService.cleanup();

    expect(mockMessaging.getToken).not.toHaveBeenCalled();
    expect(mockMessaging.onTokenRefresh).not.toHaveBeenCalled();
    expect(mockMessaging.deleteToken).not.toHaveBeenCalled();
  });
});
