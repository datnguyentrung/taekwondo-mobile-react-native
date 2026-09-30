import { useRouter } from "expo-router";
import { StyleSheet } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";

import { PackageRegisterButton } from "@/features/course/screens/PackageDetailScreen/PackageRegisterButton";
import type { CourseRouteProps } from "@/features/student-commerce/types";
import {
  asHref,
  getCommerceState,
  getCourse,
} from "@/features/student-commerce/utils/studentCommerceUtils";

import { CourseDetailContent } from "./CourseDetailContent";

export function AdminCourseDetailScreen({ courseId }: CourseRouteProps) {
  const router = useRouter();
  const state = getCommerceState();
  const course = getCourse(state.courses, courseId);
  const registrationDisabled = course.catalogStatus === "ended";

  return (
    <StackScreenLayout
      title="Chi tiết khóa học"
      contentContainerStyle={styles.content}
      floatingContent={
        <PackageRegisterButton
          title="Đăng ký học viên"
          accessibilityLabel="Đăng ký học viên"
          disabled={registrationDisabled}
          onPress={() =>
            router.push(asHref(`/courses/${course.courseId}/register`))
          }
        />
      }
    >
      <CourseDetailContent
        course={course}
        onOpenAssistants={() =>
          router.push(asHref(`/courses/${course.courseId}/assistants`))
        }
        onOpenStudents={() =>
          router.push(asHref(`/courses/${course.courseId}/students`))
        }
        onOpenPackage={(packageId) =>
          router.push(asHref(`/courses/${course.courseId}/packages/${packageId}`))
        }
      />
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
});
