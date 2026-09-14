import { Pressable, StyleSheet, View } from "react-native";

import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

import type { CourseView } from "../../types";
import { formatVnd, getCommerceState } from "../../utils/studentCommerceUtils";
import { CourseIconBox } from "./CommerceCards";
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
      title={`Gói học - ${course.courseName}`}
      heightRatio={0.55}
      onClose={onClose}
    >
      <View style={styles.sheetBody}>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Chọn gói phù hợp. Số buổi được ưu tiên hiển thị trước giá.
        </ThemedText>
        {course.packages.map((item) => (
          <SurfaceCard key={item.id}>
            <View style={styles.row}>
              <CourseIconBox size={88} />
              <View style={styles.flex}>
                <ThemedText type="bodySmall" style={styles.blackText}>
                  {item.sessions} BUỔI
                </ThemedText>
                <ThemedText type="bodySmall" style={styles.blackText}>
                  {item.durationLabel}
                </ThemedText>
                <ThemedText type="bodySmall" style={styles.blackText}>
                  {formatVnd(item.amount)}
                </ThemedText>
                <Pressable onPress={() => onOpenPackage(item.id)}>
                  <ThemedText type="action" style={styles.primaryText}>
                    Xem chi tiết →
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </SurfaceCard>
        ))}
        <ThemedText type="bodySmall" style={styles.blackText}>
          Hiện có {course.packages.length} gói đang áp dụng: 1 tháng và 3 tháng.
        </ThemedText>
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
  flex: {
    flex: 1,
    minWidth: 0,
  },
  blackText: {
    color: Colors.light.text,
  },
  primaryText: {
    color: Colors.light.primary,
  },
  pressed: {
    opacity: 0.75,
  },
});
