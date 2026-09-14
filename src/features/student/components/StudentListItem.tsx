import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, hexToRgba, radii } from "@/theme";

import { SurfaceCard } from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { StudentSummaryView } from "@/features/student-commerce/types";
import { getStudentInitials } from "@/features/student/utils/studentListViewModel";

import { StudentStatusPill } from "./StudentStatusPill";

export function StudentListItem({
  student,
  onPress,
}: {
  student: StudentSummaryView;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem học viên ${student.fullName}`}
      onPress={onPress}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      <SurfaceCard>
        <View style={styles.row}>
          <View style={styles.avatar}>
            <ThemedText type="title" style={styles.avatarText}>
              {getStudentInitials(student.fullName)}
            </ThemedText>
          </View>
          <View style={styles.flex}>
            <ThemedText
              type="bodySmall"
              style={styles.blackText}
              numberOfLines={1}
            >
              {student.fullName}
            </ThemedText>
            <ThemedText
              type="bodySmall"
              style={styles.secondaryText}
              numberOfLines={1}
            >
              {student.studentCode} · {student.beltLabel}
            </ThemedText>
          </View>
          <StudentStatusPill label={student.statusLabel} />
        </View>
        <ThemedText type="bodySmall" style={styles.secondaryText} numberOfLines={1}>
          {student.branchName}
        </ThemedText>
      </SurfaceCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: hexToRgba(Colors.light.primary, 0.08),
  },
  avatarText: {
    color: Colors.light.text,
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
