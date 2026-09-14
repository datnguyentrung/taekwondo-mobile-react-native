import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, radii } from "@/theme";

import {
  InfoRow,
  PrimaryActionButton,
  StatusBadge,
  SurfaceCard,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { CourseRouteProps } from "@/features/student-commerce/types";
import { asHref, getCommerceState, getCourse } from "@/features/student-commerce/utils/studentCommerceUtils";

export function AdminCourseDetailScreen({ courseId }: CourseRouteProps) {
  const router = useRouter();
  const state = getCommerceState();
  const course = getCourse(state.courses, courseId);

  return (
    <StackScreenLayout
      title="Chi tiết khóa học"
      contentContainerStyle={styles.content}
    >
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          {course.courseName}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Cơ sở {course.branchName} · {course.statusLabel}
        </ThemedText>
        <StatusBadge label={course.statusLabel} />
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Thông tin
        </ThemedText>
        <InfoRow label="Lịch học" value={course.scheduleLabel} />
        <InfoRow label="Sức chứa" value={`${course.capacity ?? 0} học viên`} />
        <InfoRow
          label="Đang học"
          value={`${course.enrolledStudentCount ?? 0} học viên`}
        />
        <InfoRow label="Gói học" value="1 tháng / 3 tháng" />
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          Quản lý
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Chưa có dữ liệu quản lý được gán cho khóa học này.
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          Huấn luyện viên
        </ThemedText>
        <View style={styles.coachCard}>
          <View style={styles.coachImage}>
            <AppIcon
              name="personOutline"
              size={48}
              color={Colors.light.textSecondary}
            />
          </View>
          <ThemedText type="bodySmall" style={styles.blackText}>
            {course.coachName}
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.blackText}>
            Huấn luyện viên chính
          </ThemedText>
        </View>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          Trợ giảng {course.assistantCount ?? 2} người
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Dữ liệu hiện tại chỉ có số lượng; không tạo tên trợ giảng giả.
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="title" style={styles.blackText}>
          Học viên {course.enrolledStudentCount ?? 18} học viên
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Danh sách hiển thị theo enrollment ACTIVE của khóa học tại thời điểm
          hiện tại.
        </ThemedText>
        {state.students.map((student) => (
          <View key={student.studentCode} style={styles.studentLine}>
            <View style={styles.personBubble}>
              <AppIcon
                name="personOutline"
                size={22}
                color={Colors.light.text}
              />
            </View>
            <View>
              <ThemedText type="bodySmall" style={styles.blackText}>
                {student.fullName}
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.blackText}>
                {student.studentCode}
              </ThemedText>
            </View>
          </View>
        ))}
        <ThemedText type="title" style={styles.blackText}>
          Cuộn xuống để xem tiếp danh sách học viên.
        </ThemedText>
      </SurfaceCard>
      <PrimaryActionButton
        title="Đăng ký học viên"
        onPress={() =>
          router.push(asHref(`/courses/${course.courseId}/register`))
        }
      />
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
  blackText: {
    color: Colors.light.text,
  },
  coachCard: {
    width: 152,
    gap: 8,
    padding: 10,
    borderRadius: radii.lg,
    backgroundColor: Colors.light.backgroundElement,
  },
  coachImage: {
    width: 132,
    height: 112,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
  },
  studentLine: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  personBubble: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
});
