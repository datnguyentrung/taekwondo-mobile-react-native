import { Permission } from '@/features/authorization';
import { NotificationScreen } from '@/features/notification';
import { RequirePermission } from '@/routes/navigation/RequirePermission';

export default function NotificationRoute() {
  return (
    <RequirePermission permission={Permission.NOTIFICATION_RECIPIENT_READ}>
      <NotificationScreen />
    </RequirePermission>
  );
}
