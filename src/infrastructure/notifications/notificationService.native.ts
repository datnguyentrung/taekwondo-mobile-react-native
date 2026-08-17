import { PermissionsAndroid, Platform } from 'react-native';

import type { NotificationService } from './notification.types';

// import {
//   AuthorizationStatus,
//   deleteToken,
//   getMessaging,
//   getToken,
//   hasPermission,
//   onMessage,
//   onTokenRefresh,
//   requestPermission,
// } from '@react-native-firebase/messaging';

// async function hasNotificationPermission(): Promise<boolean> {
//   if (Platform.OS === 'android') {
//     if (Platform.Version < 33) return true;
//     return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
//   }
//
//   const status = await hasPermission(getMessaging());
//   return (
//     status === AuthorizationStatus.AUTHORIZED ||
//     status === AuthorizationStatus.PROVISIONAL
//   );
// }
//
// async function requestNotificationPermission(): Promise<boolean> {
//   if (Platform.OS === 'android') {
//     if (Platform.Version < 33) return true;
//     const result = await PermissionsAndroid.request(
//       PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
//     );
//     return result === PermissionsAndroid.RESULTS.GRANTED;
//   }
//
//   const status = await requestPermission(getMessaging());
//   return (
//     status === AuthorizationStatus.AUTHORIZED ||
//     status === AuthorizationStatus.PROVISIONAL
//   );
// }

void PermissionsAndroid;

export const notificationService: NotificationService = {
  platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',

  async getToken(options: { requestPermission: boolean }): Promise<string | null> {
    void options;
    // const allowed = options.requestPermission
    //   ? await requestNotificationPermission()
    //   : await hasNotificationPermission();
    // return allowed ? getToken(getMessaging()) : null;
    return null;
  },

  subscribeToTokenRefresh(listener: (token: string) => void): () => void {
    void listener;
    // return onTokenRefresh(getMessaging(), listener);
    return () => undefined;
  },

  subscribeToForegroundMessages(listener: () => void): () => void {
    void listener;
    // return onMessage(getMessaging(), () => listener());
    return () => undefined;
  },

  async cleanup(): Promise<void> {
    // await deleteToken(getMessaging());
    return undefined;
  },
};
