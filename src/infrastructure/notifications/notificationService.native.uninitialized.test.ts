/* eslint-disable import/first -- Jest mock factories must be declared before the module under test is imported. */

const mockGetMessaging = jest.fn(() => {
  throw new Error("No Firebase App '[DEFAULT]' has been created");
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { appOwnership: 'standalone' },
  AppOwnership: { Expo: 'expo', Guest: 'guest', Standalone: 'standalone' },
}));

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: mockGetMessaging,
}));

import { notificationService } from './notificationService.native';

describe('native notification adapter without Firebase app initialization', () => {
  it('returns a no-op token refresh subscription', () => {
    const unsubscribe = notificationService.subscribeToTokenRefresh(jest.fn());

    expect(unsubscribe).toEqual(expect.any(Function));
    expect(mockGetMessaging).toHaveBeenCalled();
  });
});
