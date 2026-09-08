import { AppIcon } from "@/shared/ui/AppIcon";
import { Colors } from "@/theme";
import type { AppIconName } from "@/theme/icons";

import type { NotificationType } from "../constants/notification.constants";

const notificationTypeIcon: Record<NotificationType, AppIconName> = {
  SYSTEM: "bellOutline",
  ATTENDANCE: "checkRead",
  TUITION: "wallet",
  CLASS_SCHEDULE: "calendar",
  COACH_TIMESHEET: "clockOutline",
  ANNOUNCEMENT: "noteText",
  CLASS_SESSION_REPORT: "docText",
};

export type NotificationTypeIconProps = {
  type: NotificationType;
  size?: number;
  color?: string;
};

export function NotificationTypeIcon({
  type,
  size = 22,
  color = Colors.light.primary,
}: NotificationTypeIconProps) {
  return <AppIcon name={notificationTypeIcon[type]} size={size} color={color} />;
}
