import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, radii } from "@/theme";

import {
  RootLikeScreen,
  SegmentedTabs,
  StatusBadge,
  SurfaceCard,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import { asHref, getCommerceState } from "@/features/student-commerce/utils/studentCommerceUtils";

export function StudentListScreen() {
  const router = useRouter();
  const state = getCommerceState();

  return (
    <RootLikeScreen title="Học viên" activeTab="activities">
      <View style={styles.inlineSummary}>
        <ThemedText type="bodySmall" style={styles.blackText}>
          467 học viên
        </ThemedText>
        <StatusBadge label="216 hoạt động" />
      </View>
      <SegmentedTabs
        value="learning"
        tabs={[
          { value: "all", label: "Tất cả" },
          { value: "learning", label: "Đang học" },
          { value: "paused", label: "Bảo lưu" },
        ]}
        onChange={() => undefined}
      />
      {state.students.map((student) => (
        <Pressable
          key={student.studentCode}
          accessibilityRole="button"
          onPress={() =>
            router.push(asHref(`/students/${student.studentCode}`))
          }
          style={({ pressed }) => [pressed ? styles.pressed : null]}
        >
          <SurfaceCard>
            <View style={styles.row}>
              <View style={styles.smallAvatar} />
              <View style={styles.flex}>
                <ThemedText type="bodySmall" style={styles.blackText}>
                  {student.fullName}
                </ThemedText>
                <ThemedText type="bodySmall" style={styles.blackText}>
                  {student.studentCode} · {student.beltLabel}
                </ThemedText>
              </View>
              <StatusBadge label={student.statusLabel} />
            </View>
            <ThemedText type="bodySmall" style={styles.blackText}>
              {student.branchName}
            </ThemedText>
          </SurfaceCard>
        </Pressable>
      ))}
      <ThemedText type="bodySmall" style={styles.blackText}>
        Chọn học viên để xem hồ sơ, ví và khóa học.
      </ThemedText>
    </RootLikeScreen>
  );
}

const styles = StyleSheet.create({
  inlineSummary: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.surface,
  },
  blackText: {
    color: Colors.light.text,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  smallAvatar: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  pressed: {
    opacity: 0.75,
  },
});
