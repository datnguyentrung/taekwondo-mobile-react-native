export type NotificationPlatform = 'ANDROID' | 'IOS' | 'WEB';

export type NotificationService = {
  platform: NotificationPlatform;
  getToken: (options: { requestPermission: boolean }) => Promise<string | null>;
  subscribeToTokenRefresh: (listener: (token: string) => void) => () => void;
  subscribeToForegroundMessages: (listener: () => void) => () => void;
  cleanup: () => Promise<void>;
};
