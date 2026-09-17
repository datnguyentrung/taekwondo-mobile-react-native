import { Pressable, StyleSheet, View } from "react-native";

import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

import type { CourseView } from "../../types";
import {
  formatVnd,
  getCommerceState,
  getMonthlyPackagePrice,
} from "../../utils/studentCommerceUtils";
import { StatusBadge, SurfaceCard } from "./CommerceLayoutPrimitives";

export function PackageSheet({
  visible,
  course,
  onClose,
  onOpenPackage,
}: {
  visible: boolean;
  course?: CourseView;
  onClose: () => void;
  onOpenPackage: (packageId: string) => void;
}) {
  if (!course) return null;

  return (
    <BottomSheetWindow
      visible={visible}
      title="Gói học"
      heightRatio={0.55}
      onClose={onClose}
    >
      <View style={styles.sheetBody}>
        {course.packages.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Xem chi tiết gói ${item.durationLabel}`}
            onPress={() => onOpenPackage(item.id)}
            style={({ pressed }) => [pressed ? styles.pressed : null]}
          >
            <SurfaceCard>
              <View style={styles.packageRow}>
                <View style={styles.flex}>
                  <ThemedText type="title" style={styles.blackText}>
                    {item.durationLabel}
                  </ThemedText>
                  <ThemedText type="heading" style={styles.blackText}>
                    {formatVnd(item.amount)}
                  </ThemedText>
                  {getMonthlyPackagePrice(item) !== item.amount ? (
                    <ThemedText type="bodySmall" style={styles.secondaryText}>
                      {formatVnd(getMonthlyPackagePrice(item))}/tháng
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            </SurfaceCard>
          </Pressable>
        ))}
      </View>
    </BottomSheetWindow>
  );
}

export function PackageCoursePicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (courseId: string) => void;
}) {
  const state = getCommerceState();
  const options = state.courses.filter((course) =>
    ["basic", "advanced", "expert"].includes(course.courseId),
  );

  return (
    <BottomSheetWindow
      visible={visible}
      title="Chọn khóa học"
      heightRatio={0.45}
      onClose={onClose}
    >
      <View style={styles.sheetBody}>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Có thể học nhiều khóa cùng lúc. Khóa đang học không đăng ký trùng.
        </ThemedText>
        {options.map((course) => (
          <Pressable
            key={course.courseId}
            accessibilityRole="button"
            onPress={() => onSelect(course.courseId)}
            style={({ pressed }) => [pressed ? styles.pressed : null]}
          >
            <SurfaceCard soft>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <ThemedText type="title" style={styles.blackText}>
                    {course.courseName}
                  </ThemedText>
                  <ThemedText type="bodySmall" style={styles.blackText}>
                    {course.branchName} · {course.scheduleLabel}
                  </ThemedText>
                </View>
                <StatusBadge
                  label={course.courseId === "expert" ? "Đăng ký" : "Đang học"}
                />
              </View>
            </SurfaceCard>
          </Pressable>
        ))}
      </View>
    </BottomSheetWindow>
  );
}

const styles = StyleSheet.create({
  sheetBody: {
    gap: 12,
    padding: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  packageRow: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  flex: {
    flex: 1,
    minWidth: 0,
  },
  blackText: {
    color: Colors.light.text,
  },
  secondaryText: {
    color: Colors.light.textSecondary,
  },
  pressed: {
    opacity: 0.75,
  },
});
