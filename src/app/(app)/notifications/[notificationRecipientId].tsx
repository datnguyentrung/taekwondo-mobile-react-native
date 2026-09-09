import { Permission } from '@/features/authorization';
import { NotificationDetailScreen } from '@/features/notification';
import { RequirePermission } from '@/routes/navigation/RequirePermission';

export default function NotificationDetailRoute() {
  return (
    <RequirePermission permission={Permission.NOTIFICATION_RECIPIENT_READ}>
      <NotificationDetailScreen />
    </RequirePermission>
  );
}
