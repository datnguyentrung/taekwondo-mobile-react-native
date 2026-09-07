import { StyleSheet, View } from "react-native";

import BottomTabScreenLayout, {
  type HeaderAction,
} from "@/routes/navigation/layouts/BottomTabScreenLayout";
import { Colors } from "@/theme";

import { useRouter } from "expo-router";
import { useState } from "react";
import type { ActivitiesAction } from "./components/ActivitiesActionButton";
import { ActivitiesGridSection } from "./components/ActivitiesGridSection";

const CATALOG_FEATURES: ActivitiesAction[] = [
  { label: "Điểm danh", icon: "featureAttendance" },
  { label: "Bảng xếp hạng", icon: "featureRanking" },
  { label: "Danh sách học viên", icon: "featureStudentList" },
  { label: "Danh sách HLV", icon: "featureCoachList" },
];

const GENERAL_UTILITIES: ActivitiesAction[] = Array.from(
  { length: 8 },
  (_, index) => ({
    label: `TN${index + 1}`,
    icon:
      index === 2 || index === 6
        ? "featureUtilityDashboardAlt"
        : "featureUtilityDashboard",
  }),
);

export default function ActivitiesScreen() {
  const [changeListQuickFeatures, setChangeListQuickFeatures] =
    useState<boolean>(false);
  const router = useRouter();

  const actions: HeaderAction[] = [
    {
      icon: "bellOutline",
      label: "Thông báo",
      onPress: () => router.push("/"),
    },
    {
      icon: changeListQuickFeatures ? "star" : "checkRead",
      label: "Trang chủ",
      onPress: () => setChangeListQuickFeatures(!changeListQuickFeatures),
    },
  ];

  return (
    <BottomTabScreenLayout
      title="Tính năng"
      activeTab="activities"
      rightActions={actions}
    >
      <ActivitiesGridSection actions={CATALOG_FEATURES} variant="quick" />

      <ActivitiesGridSection
        title="Danh mục"
        actions={CATALOG_FEATURES}
        style={styles.catalogSection}
      />

      <View style={styles.divider} />

      <ActivitiesGridSection
        title="Tiện ích chung"
        actions={GENERAL_UTILITIES}
        style={styles.utilitySection}
      />
    </BottomTabScreenLayout>
  );
}

const styles = StyleSheet.create({
  catalogSection: {
    marginTop: 48,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 31,
    backgroundColor: Colors.light.divider,
  },
  utilitySection: {
    marginTop: 32,
  },
});
