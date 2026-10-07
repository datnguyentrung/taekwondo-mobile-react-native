import type { ActivitiesActionGroup } from "@/features/activities/domain/activities.types";
import { Permission } from "@/features/authorization";
import { CalendarCheck } from "lucide-react-native";
import {
  Book,
  Building,
  Profile2user,
  ShieldUser,
  Teacher,
  Trophy,
  Users2,
} from "reicon-react-native";

export const ACTIVITIES_GROUPS: ActivitiesActionGroup[] = [
  {
    title: "Tính năng",
    actions: [
      {
        id: "attendance-history",
        label: "Lịch sử",
        icon: <CalendarCheck />,
        defaultQuick: true,
      },
      {
        id: "ranking",
        label: "Bảng xếp hạng",
        icon: <Trophy />,
        defaultQuick: true,
      },
      {
        id: "student-list",
        label: "Học viên",
        icon: <Users2 />,
        defaultQuick: true,
      },
      {
        id: "course-list",
        label: "Khóa học",
        icon: <Book />,
      },
      {
        id: "coach-list",
        label: "Huấn luyện viên",
        icon: <Teacher />,
        defaultQuick: true,
      },
    ],
  },
  {
    title: "Tiện ích chung",
    actions: [
      {
        id: "branch-list",
        label: "Cơ sở",
        icon: <Building />,
      },
      {
        id: "role-permission-admin",
        label: "Vai trò & quyền",
        icon: <ShieldUser />,
        requiredPermissions: [Permission.ROLE_READ, Permission.PERMISSION_READ],
      },
      {
        id: "position-admin",
        label: "Chức vụ",
        icon: <Teacher />,
        requiredPermissions: [Permission.POSITION_READ],
      },
      {
        id: "user-admin",
        label: "Người dùng",
        icon: <Profile2user />,
        requiredPermissions: [Permission.USER_READ],
      },
      {
        id: "mqtt-sensor",
        label: "Cảm biến (MQTT)",
        icon: <CalendarCheck />,
      },
    ],
  },
];
