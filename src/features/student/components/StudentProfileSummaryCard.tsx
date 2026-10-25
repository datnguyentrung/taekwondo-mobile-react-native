import { User } from "reicon-react-native";
import { StyleSheet, View } from "react-native";

import type { StudentSummaryView } from "@/features/student-commerce/types";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { StatusBadge, SurfaceCard } from "@/shared/ui/commerce/CommercePrimitives";
import { Colors, radii } from "@/theme";

function formatBirthDate(value?: string | null) {
  if (!value) return "Chưa cập nhật ngày sinh";
  const [year, month, day] = value.slice(0, 10).split("-");
  return year && month && day ? `${day}/${month}/${year}` : value;
}

export function StudentProfileSummaryCard({
  student,
}: {
  student: StudentSummaryView;
}) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.avatar}>
        <AppIcon icon={<User weight="Filled" />} size={26} color={Colors.light.primary} />
      </View>
      <View style={styles.copy}>
        <ThemedText type="title" numberOfLines={1} style={styles.text}>
          {student.fullName}
        </ThemedText>
        <ThemedText type="bodySmall" numberOfLines={1} style={styles.text}>
          {formatBirthDate(student.birthDate)} · {student.beltLabel}
        </ThemedText>
      </View>
      <StatusBadge label={student.statusLabel} />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  text: {
    color: Colors.light.text,
  },
});
