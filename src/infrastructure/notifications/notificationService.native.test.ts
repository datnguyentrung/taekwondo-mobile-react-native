import {
  AuthorizationStatus,
  deleteToken,
  getToken,
  hasPermission,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

import { notificationService } from './notificationService.native';

const messagingMocks = {
  deleteToken: deleteToken as jest.MockedFunction<typeof deleteToken>,
  getToken: getToken as jest.MockedFunction<typeof getToken>,
  hasPermission: hasPermission as jest.MockedFunction<typeof hasPermission>,
  onTokenRefresh: onTokenRefresh as jest.MockedFunction<typeof onTokenRefresh>,
  requestPermission: requestPermission as jest.MockedFunction<typeof requestPermission>,
};

describe('native notification adapter', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not request permission or fetch a token before login when permission is denied', async () => {
    if (Platform.OS === 'ios') {
      messagingMocks.hasPermission.mockResolvedValueOnce(AuthorizationStatus.NOT_DETERMINED);
    }

    await expect(
      notificationService.getToken({ requestPermission: false }),
    ).resolves.toBeNull();
    expect(messagingMocks.requestPermission).not.toHaveBeenCalled();
    expect(messagingMocks.getToken).not.toHaveBeenCalled();
  });

  it('returns the native unsubscribe function and deletes the device token on cleanup', async () => {
    const unsubscribe = jest.fn();
    const listener = jest.fn();
    messagingMocks.onTokenRefresh.mockReturnValueOnce(unsubscribe);

    expect(notificationService.subscribeToTokenRefresh(listener)).toBe(unsubscribe);
    await notificationService.cleanup();

    expect(messagingMocks.onTokenRefresh).toHaveBeenCalledWith(expect.any(Object), listener);
    expect(messagingMocks.deleteToken).toHaveBeenCalledTimes(1);
  });
});
