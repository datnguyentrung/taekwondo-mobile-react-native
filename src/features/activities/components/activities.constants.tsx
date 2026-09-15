import type { ActivitiesActionGroup } from "@/features/activities/domain/activities.types";
import { CalendarCheck } from "lucide-react-native";
import {
  Book,
  Building,
  Teacher,
  Trophy,
  Users2,
  Widget,
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
      { id: "utility-2", label: "TN2", icon: <Widget /> },
      { id: "utility-3", label: "TN3", icon: <Widget /> },
      { id: "utility-4", label: "TN4", icon: <Widget /> },
      { id: "utility-5", label: "TN5", icon: <Widget /> },
      { id: "utility-6", label: "TN6", icon: <Widget /> },
      { id: "utility-7", label: "TN7", icon: <Widget /> },
      { id: "utility-8", label: "TN8", icon: <Widget /> },
    ],
  },
];
