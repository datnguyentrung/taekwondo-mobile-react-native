import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';

import { useNotificationStore } from '@/features/notification/store/notification.store';
import { notificationService } from '@/infrastructure/notifications/notificationService';

import { authSessionService } from '../services/authSessionService';
import { useAuthStore } from '../store/auth.store';

export function useAuthenticationRuntime(): void {
  const status = useAuthStore((state) => state.status);
  const activePersonId = useAuthStore(
    (state) => state.activeContext?.personId ?? null,
  );

  useEffect(() => {
    const disposeHttp = authSessionService.configureHttp();
    void authSessionService.bootstrap();
    return disposeHttp;
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' && status !== 'selecting-context') {
      return undefined;
    }

    void authSessionService.syncFcm({ requestPermission: true }).catch(() => undefined);
    const unsubscribeToken = notificationService.platform === 'ANDROID'
      ? notificationService.subscribeToTokenRefresh((token) => {
          void authSessionService.syncFcm({ token }).catch(() => undefined);
        })
      : () => undefined;
    const unsubscribeMessages =
      notificationService.subscribeToForegroundMessages((message) => {
        if (message.type === 'PASSWORD_RESET_CODE' && message.code) {
          Alert.alert('Mã đặt lại mật khẩu', `Mã OTP của bạn là ${message.code}. Mã có hiệu lực trong 5 phút.`);
          return;
        }
        useNotificationStore.getState().incrementUnread();
      });

    return () => {
      unsubscribeToken();
      unsubscribeMessages();
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    void useNotificationStore
      .getState()
      .fetchUnreadCount({ personId: activePersonId });
  }, [activePersonId, status]);

  useEffect(() => {
    if (status !== 'authenticated' && status !== 'selecting-context') {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void authSessionService.syncFcm().catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [status]);
}
