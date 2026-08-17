import {
  AuthorizationStatus,
  deleteToken,
  getMessaging,
  getToken,
  hasPermission,
  onMessage,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';

import type { NotificationService } from './notification.types';

async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  const status = await hasPermission(getMessaging());
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  const status = await requestPermission(getMessaging());
  return (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL
  );
}

export const notificationService: NotificationService = {
  platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',

  async getToken(options: { requestPermission: boolean }): Promise<string | null> {
    const allowed = options.requestPermission
      ? await requestNotificationPermission()
      : await hasNotificationPermission();
    return allowed ? getToken(getMessaging()) : null;
  },

  subscribeToTokenRefresh(listener: (token: string) => void): () => void {
    return onTokenRefresh(getMessaging(), listener);
  },

  subscribeToForegroundMessages(listener: () => void): () => void {
    return onMessage(getMessaging(), () => listener());
  },

  async cleanup(): Promise<void> {
    await deleteToken(getMessaging());
  },
};
