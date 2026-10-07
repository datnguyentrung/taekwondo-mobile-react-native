import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { courseApi } from "@/features/course/api/courseApi";
import { mapCourseApiToView } from "@/features/course/domain/course.mappers";
import { PackageRegisterButton } from "@/features/course/screens/PackageDetailScreen/PackageRegisterButton";
import type { CourseRouteProps, CourseView } from "@/features/student-commerce/types";
import {
  asHref,
  getCommerceState,
  getCourse,
} from "@/features/student-commerce/utils/studentCommerceUtils";
import { useScreenRefresh } from "@/infrastructure/query/useScreenRefresh";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { useGetQuery } from "@/shared/hooks/useCrud";
import { Colors } from "@/theme";

import { CourseDetailContent } from "./CourseDetailContent";

export function AdminCourseDetailScreen({ courseId }: CourseRouteProps) {
  const router = useRouter();
  const state = getCommerceState();
  const mockCourse = getCourse(state.courses, courseId);

  const courseQuery = useGetQuery(
    ["courses", courseId],
    () => courseApi.get(courseId!),
    {
      enabled: Boolean(courseId),
      retry: false,
    },
  );

  const { data: apiCourse, isLoading } = courseQuery;
  const { refreshing, onRefresh } = useScreenRefresh([courseQuery]);

  const course: CourseView = useMemo(() => {
    if (apiCourse) {
      // Map API CourseResponse to CourseView, reusing packages from mock if available
      return mapCourseApiToView(apiCourse, mockCourse?.packages ?? []);
    }
    return mockCourse;
  }, [apiCourse, mockCourse]);

  const registrationDisabled = course.catalogStatus === "ended";

  return (
    <StackScreenLayout
      title="Chi tiết khóa học"
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
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
        topContent={
          isLoading && !apiCourse ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.light.primary} />
            </View>
          ) : undefined
        }
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
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
