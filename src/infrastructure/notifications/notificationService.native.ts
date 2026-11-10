import Constants, { AppOwnership } from 'expo-constants';
import { PermissionsAndroid, Platform } from 'react-native';

import type { NotificationService } from './notification.types';

type FirebaseMessaging = typeof import('@react-native-firebase/messaging');
type FirebaseMessagingRuntime = {
  api: FirebaseMessaging;
  instance: ReturnType<FirebaseMessaging['getMessaging']>;
};

/** Expo Go does not embed React Native Firebase native modules. */
function getFirebaseMessaging(): FirebaseMessagingRuntime | null {
  if (Constants.appOwnership === AppOwnership.Expo) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- defer a native-only module until a compatible runtime is confirmed.
    const api = require('@react-native-firebase/messaging') as FirebaseMessaging;
    return { api, instance: api.getMessaging() };
  } catch {
    // The JavaScript package can be bundled even when native Firebase is not
    // configured. Treat both cases as an unavailable notification capability.
    return null;
  }
}

async function hasNotificationPermission(): Promise<boolean> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return false;

  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }
  const status = await messaging.api.hasPermission(messaging.instance);
  return (
    status === messaging.api.AuthorizationStatus.AUTHORIZED ||
    status === messaging.api.AuthorizationStatus.PROVISIONAL
  );
}

async function requestNotificationPermission(): Promise<boolean> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return false;

  if (Platform.OS === 'android') {
    if (Platform.Version < 33) return true;
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await messaging.api.requestPermission(messaging.instance);
  return (
    status === messaging.api.AuthorizationStatus.AUTHORIZED ||
    status === messaging.api.AuthorizationStatus.PROVISIONAL
  );
}

export const notificationService: NotificationService = {
  platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',

  async getToken(options: { requestPermission: boolean }): Promise<string | null> {
    const messaging = getFirebaseMessaging();
    if (!messaging) return null;

    const allowed = options.requestPermission
      ? await requestNotificationPermission()
      : await hasNotificationPermission();
    return allowed ? messaging.api.getToken(messaging.instance) : null;
  },

  subscribeToTokenRefresh(listener: (token: string) => void): () => void {
    const messaging = getFirebaseMessaging();
    return messaging
      ? messaging.api.onTokenRefresh(messaging.instance, listener)
      : () => undefined;
  },

  subscribeToForegroundMessages(listener): () => void {
    const messaging = getFirebaseMessaging();
    if (!messaging) return () => undefined;

    return messaging.api.onMessage(messaging.instance, (message) =>
      listener({
        type:
          typeof message.data?.type === 'string'
            ? message.data.type
            : undefined,
        code:
          typeof message.data?.code === 'string'
            ? message.data.code
            : undefined,
      }),
    );
  },

  async cleanup(): Promise<void> {
    const messaging = getFirebaseMessaging();
    if (messaging) await messaging.api.deleteToken(messaging.instance);
  },
};
