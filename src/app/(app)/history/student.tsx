import { AttendanceHistoryScreen } from '@/features/attendance-history';
import { Permission } from '@/features/authorization';
import { RequirePermission } from '@/routes/navigation/RequirePermission';

export default function StudentHistoryRoute() {
  return (
    <RequirePermission permission={Permission.SESSION_ATTENDANCE_READ}>
      <AttendanceHistoryScreen mode="student" />
    </RequirePermission>
  );
}
