import { User } from "reicon-react-native";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import {
  NavigationMenu,
  NavigationMenuItem,
} from "@/shared/ui/NavigationMenu/NavigationMenu";
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
            <AppIcon icon={<User />}
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
      <NavigationMenu>
        <NavigationMenuItem
          icon={<User />}
          title="Trợ giảng"
          count={course.assistantCount ?? 2}
          subtitle="Danh sách trợ giảng của khóa học"
          onPress={() =>
            router.push(asHref(`/courses/${course.courseId}/assistants`))
          }
        />
        <NavigationMenuItem
          icon={<User />}
          title="Học viên"
          count={course.enrolledStudentCount ?? 0}
          subtitle="Enrollment ACTIVE của khóa học"
          onPress={() =>
            router.push(asHref(`/courses/${course.courseId}/students`))
          }
        />
      </NavigationMenu>
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

});
