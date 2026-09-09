import { useNotificationStore } from '@/features/notification/store/notification.store';
import { useRouter } from 'expo-router';

import { HeaderActionButton } from './HeaderActionButton';

export function NotificationHeaderButton({ color }: { color?: string }) {
  const router = useRouter();
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const badge =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? unreadCount : undefined;

  return (
    <HeaderActionButton
      icon="bellOutline"
      label="Thông báo"
      badge={badge}
      color={color}
      onPress={() => router.push('/notifications')}
      testID="notification-header-button"
    />
  );
}
