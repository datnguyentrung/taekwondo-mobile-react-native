import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

import {
  InfoRow,
  PrimaryActionButton,
  SurfaceCard,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { CourseRouteProps } from "@/features/student-commerce/types";
import {
  asHref,
  formatVnd,
  getCommerceState,
  getCourse,
  getPackage,
} from "@/features/student-commerce/utils/studentCommerceUtils";

export function PackageDetailScreen({ courseId, packageId }: CourseRouteProps) {
  const router = useRouter();
  const state = getCommerceState();
  const course = getCourse(state.courses, courseId);
  const item = getPackage(course, packageId)!;

  return (
    <StackScreenLayout
      title="Chi tiết gói học"
      contentContainerStyle={styles.content}
    >
      <SurfaceCard soft>
        <ThemedText type="title" style={styles.blackText}>
          {course.courseName}
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="subtitle" style={styles.primaryText}>
          {item.sessions} BUỔI
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {item.durationLabel}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          {formatVnd(item.amount)}
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Bạn nhận được
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          • {item.sessions} buổi học theo lịch của khóa học đã chọn
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          • Không có buổi tặng hoặc ưu đãi bổ sung trong dữ liệu hiện tại
        </ThemedText>
      </SurfaceCard>
      <SurfaceCard soft>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Thông tin gói
        </ThemedText>
        <InfoRow label="Số buổi" value={`${item.sessions} buổi`} />
        <InfoRow label="Thời hạn" value={item.durationLabel} />
        <InfoRow label="Giá" value={formatVnd(item.amount)} />
      </SurfaceCard>
      <SurfaceCard>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Điều kiện & chính sách
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Áp dụng khi khóa học đang mở đăng ký.
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Thời hạn sử dụng được tính theo kỳ học sau khi đăng ký.
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.blackText}>
          Các chính sách khác áp dụng theo quy định hiện hành của trung tâm.
        </ThemedText>
      </SurfaceCard>
      <PrimaryActionButton
        title="Đăng ký"
        onPress={() =>
          router.push(
            asHref(`/courses/${course.courseId}/packages/${item.id}/register`),
          )
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
  primaryText: {
    color: Colors.light.primary,
  },
});
