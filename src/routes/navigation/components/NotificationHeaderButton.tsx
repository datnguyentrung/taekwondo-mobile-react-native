import { useNotificationStore } from '@/features/notification/store/notification.store';
import { Permission, useCan } from '@/features/authorization';
import { useRouter, type Href } from 'expo-router';

import { HeaderActionButton } from './HeaderActionButton';

export function NotificationHeaderButton({ color }: { color?: string }) {
  const router = useRouter();
  const canReadNotifications = useCan(Permission.NOTIFICATION_RECIPIENT_READ);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const badge =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? unreadCount : undefined;

  if (!canReadNotifications) return null;

  return (
    <HeaderActionButton
      icon="bellOutline"
      label="Thông báo"
      badge={badge}
      color={color}
      onPress={() => router.navigate('/notifications' as Href)}
      testID="notification-header-button"
    />
  );
}
