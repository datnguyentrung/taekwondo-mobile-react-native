import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { courseApi } from "@/features/course/api/courseApi";
import { CourseCatalogList } from "@/features/course/components/CourseCatalogList";
import { CourseCatalogSearchField } from "@/features/course/components/CourseCatalogSearchField";
import { COURSE_CATALOG_TABS } from "@/features/course/utils/courseCatalogViewModel";
import { SegmentedTabs } from "@/features/student-commerce/components/StudentCommercePrimitives";
import type {
  CourseCatalogTab,
  CourseView,
} from "@/features/student-commerce/types";
import {
  asHref,
  getCommerceState,
} from "@/features/student-commerce/utils/studentCommerceUtils";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { useGetQuery } from "@/shared/hooks/useCrud";
import { useScreenRefresh } from "@/infrastructure/query/useScreenRefresh";
import { Colors } from "@/theme";

import { mapCourseApiToView } from "@/features/course/domain/course.mappers";

export function CourseCatalogScreen({
  initialTab = "active",
}: {
  initialTab?: CourseCatalogTab;
}) {
  const router = useRouter();
  const state = getCommerceState();
  const [tab, setTab] = useState<CourseCatalogTab>(initialTab);

  // Gọi API danh sách khóa học qua useGetQuery
  const coursesQuery = useGetQuery(["courses"], () => courseApi.list());
  const { data, isLoading } = coursesQuery;
  const { refreshing, onRefresh } = useScreenRefresh([coursesQuery]);

  const courses = useMemo(() => {
    const rawList: CourseView[] =
      data?.content && data.content.length > 0
        ? data.content.map(mapCourseApiToView)
        : state.courses;

    return rawList.filter((course) => course.catalogStatus === tab);
  }, [data, state.courses, tab]);

  const showInitialLoading = isLoading && !data;

  return (
    <StackScreenLayout
      title="Khóa học"
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
    >
      <SegmentedTabs value={tab} tabs={COURSE_CATALOG_TABS} onChange={setTab} />
      <CourseCatalogSearchField tab={tab} />
      {showInitialLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <CourseCatalogList
          courses={courses}
          onCoursePress={(courseId) =>
            router.push(asHref(`/courses/${courseId}`))
          }
        />
      )}
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
