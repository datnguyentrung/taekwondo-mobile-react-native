import type { AppIconName } from "@/theme/icons";

export type ActivitiesAction = {
  id: string;
  label: string;
  icon: AppIconName;
  defaultQuick?: boolean;
};

interface GroupActivitiesAction {
  title?: string;
  actions: ActivitiesAction[];
}

export const ACTIVITIES_GROUPS: GroupActivitiesAction[] = [
  {
    title: "Tính năng",
    actions: [
      {
        id: "attendance-history",
        label: "Lịch sử điểm danh",
        icon: "featureAttendance",
        defaultQuick: true,
      },
      {
        id: "ranking",
        label: "Bảng xếp hạng",
        icon: "featureRanking",
        defaultQuick: true,
      },
      {
        id: "student-list",
        label: "Danh sách học viên",
        icon: "listCheck",
        defaultQuick: true,
      },
      {
        id: "coach-list",
        label: "Danh sách HLV",
        icon: "featureCoachList",
        defaultQuick: true,
      },
    ],
  },
  {
    title: "Tiện ích chung",
    actions: [
      { id: "utility-1", label: "TN1", icon: "featureUtilityDashboard" },
      { id: "utility-2", label: "TN2", icon: "featureUtilityDashboard" },
      { id: "utility-3", label: "TN3", icon: "featureUtilityDashboard" },
      { id: "utility-4", label: "TN4", icon: "featureUtilityDashboard" },
      { id: "utility-5", label: "TN5", icon: "featureUtilityDashboard" },
      { id: "utility-6", label: "TN6", icon: "featureUtilityDashboard" },
      { id: "utility-7", label: "TN7", icon: "featureUtilityDashboard" },
      { id: "utility-8", label: "TN8", icon: "featureUtilityDashboard" },
    ],
  },
];
