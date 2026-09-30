import { Image, Pressable, StyleSheet, View } from "react-native";

import { SurfaceCard } from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { StudentSummaryView } from "@/features/student-commerce/types";
import type { PersonSimpleResponse } from "@/features/person";
import { BeltLabel } from "@/features/person/constants/person.constants";
import { getStudentInitials } from "@/features/student/utils/studentListViewModel";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, hexToRgba, radii } from "@/theme";

import { StudentStatusPill } from "./StudentStatusPill";

export type StudentItemData = StudentSummaryView | PersonSimpleResponse;

function isPersonSimpleResponse(
  student: StudentItemData,
): student is PersonSimpleResponse {
  return "personId" in student;
}

export function StudentListItem({
  student,
  onPress,
}: {
  student: StudentItemData;
  onPress: () => void;
}) {
  const isPerson = isPersonSimpleResponse(student);
  const fullName = student.fullName;
  const code = isPerson
    ? student.personCode || student.personId
    : student.studentCode;
  const beltText = isPerson
    ? BeltLabel[student.currentBelt] || student.currentBelt
    : student.beltLabel;
  const statusLabel = isPerson
    ? student.status === "ACTIVE"
      ? "Đang học"
      : "Bảo lưu"
    : student.statusLabel;
  const subtitle = isPerson
    ? student.position?.name || "CLB Taekwondo Văn Quán"
    : student.branchName;
  const faceImagePath = isPerson ? student.faceImagePath : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Xem học viên ${fullName}`}
      onPress={onPress}
      style={({ pressed }) => [pressed ? styles.pressed : null]}
    >
      <SurfaceCard>
        <View style={styles.row}>
          {faceImagePath ? (
            <Image source={{ uri: faceImagePath }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <ThemedText type="title" style={styles.avatarText}>
                {getStudentInitials(fullName)}
              </ThemedText>
            </View>
          )}
          <View style={styles.flex}>
            <ThemedText
              type="bodySmall"
              style={styles.blackText}
              numberOfLines={1}
            >
              {fullName}
            </ThemedText>
            <ThemedText
              type="bodySmall"
              style={styles.secondaryText}
              numberOfLines={1}
            >
              {code} · {beltText}
            </ThemedText>
          </View>
          <StudentStatusPill label={statusLabel} />
        </View>
        <ThemedText type="bodySmall" style={styles.secondaryText} numberOfLines={1}>
          {subtitle}
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
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
