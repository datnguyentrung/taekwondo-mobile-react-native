import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { NavigationMenu, NavigationMenuItem } from "@/shared/ui/NavigationMenu";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

import {
  EnrollmentCard,
  PrimaryActionButton,
  StudentSummaryCard,
  SurfaceCard,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { StudentRouteProps } from "@/features/student-commerce/types";
import { asHref, formatVnd, getCommerceState } from "@/features/student-commerce/utils/studentCommerceUtils";

export function StudentDetailScreen({ studentCode }: StudentRouteProps) {
  const router = useRouter();
  const state = getCommerceState();
  const student =
    state.students.find((item) => item.studentCode === studentCode) ??
    state.selectedStudent;
  const activeEnrollments = state.enrollments
    .filter((item) => !item.history)
    .slice(0, 2);

  return (
    <StackScreenLayout
      title="Chi tiết học viên"
      contentContainerStyle={styles.content}
    >
      <StudentSummaryCard student={student} />
      <View style={styles.actionRow}>
        <PrimaryActionButton
          title="Nạp tiền"
          variant="outline"
          onPress={() =>
            router.push(asHref(`/students/${student.studentCode}/top-up`))
          }
        />
        <PrimaryActionButton
          title="Đăng ký khóa học"
          onPress={() =>
            router.push(
              asHref(`/students/${student.studentCode}/course-registration`),
            )
          }
        />
      </View>
      <SurfaceCard>
        <View style={styles.row}>
          <AppIcon name="wallet" size={24} color={Colors.light.primary} />
          <ThemedText type="bodySmall" style={styles.blackText}>
            Ví điện tử
          </ThemedText>
        </View>
        <ThemedText type="heading" style={styles.blackText}>
          {formatVnd(state.wallet.balance)}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Số dư khả dụng
        </ThemedText>
        <Pressable
          onPress={() =>
            router.push(asHref(`/students/${student.studentCode}/wallet`))
          }
        >
          <ThemedText type="action" style={styles.primaryText}>
            Xem chi tiết ví ›
          </ThemedText>
        </Pressable>
      </SurfaceCard>

      <NavigationMenu>
        <NavigationMenuItem
          icon="docText"
          title="Khóa học đang học"
          count={activeEnrollments.length}
          onPress={() =>
            router.push(asHref(`/students/${student.studentCode}/courses`))
          }
        />
        <NavigationMenuItem
          icon="featureAttendance"
          title="Lịch sử tập luyện"
          onPress={() => router.push(asHref("/history/student"))}
        />
      </NavigationMenu>

      {activeEnrollments.length > 0 ? (
        <View style={styles.enrollmentsPreview}>
          <ThemedText type="subtitle" style={styles.previewTitle}>
            Khóa học đang học gần đây
          </ThemedText>
          {activeEnrollments.map((enrollment) => (
            <EnrollmentCard
              key={enrollment.enrollmentId}
              enrollment={enrollment}
              onPress={() =>
                router.push(
                  asHref(
                    `/students/${student.studentCode}/courses/${enrollment.enrollmentId}`,
                  ),
                )
              }
            />
          ))}
        </View>
      ) : null}
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  enrollmentsPreview: {
    gap: 12,
  },
  previewTitle: {
    color: Colors.light.text,
  },
  blackText: {
    color: Colors.light.text,
  },
  primaryText: {
    color: Colors.light.primary,
  },
});
