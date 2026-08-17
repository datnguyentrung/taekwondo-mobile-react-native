import { useEffect } from 'react';

import { notificationService } from '@/infrastructure/notifications/notificationService';

import { authSessionService } from '../services/authSessionService';
import { useAuthStore } from '../store/auth.store';

export function useAuthenticationRuntime(): void {
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    const disposeHttp = authSessionService.configureHttp();
    void authSessionService.bootstrap();
    return disposeHttp;
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' && status !== 'selecting-context') {
      return undefined;
    }

    const unsubscribeToken = notificationService.subscribeToTokenRefresh(() => {
      void authSessionService.syncFcm(false).catch(() => undefined);
    });
    const unsubscribeMessages =
      notificationService.subscribeToForegroundMessages(() => undefined);

    return () => {
      unsubscribeToken();
      unsubscribeMessages();
    };
  }, [status]);
}
