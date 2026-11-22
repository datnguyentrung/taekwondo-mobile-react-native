import { useLocalSearchParams } from "expo-router";

import { Permission } from "@/features/authorization";
import { SupplementSessionAttendanceScreen } from "@/features/session-attendance";
import { RequirePermission } from "@/routes/navigation/RequirePermission";

export default function SupplementSessionAttendanceRoute() {
  const { classSessionId } = useLocalSearchParams<{
    classSessionId?: string;
  }>();

  return (
    <RequirePermission permission={Permission.SESSION_ATTENDANCE_CREATE}>
      <SupplementSessionAttendanceScreen classSessionId={classSessionId} />
    </RequirePermission>
  );
}
