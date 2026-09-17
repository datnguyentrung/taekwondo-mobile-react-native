import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";

import { CourseCatalogList } from "@/features/course/components/CourseCatalogList";
import { CourseCatalogSearchField } from "@/features/course/components/CourseCatalogSearchField";
import {
  COURSE_CATALOG_TABS,
  getCoursesForCatalogTab,
} from "@/features/course/utils/courseCatalogViewModel";
import {
  PackageSheet,
  SegmentedTabs,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
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
import { ThemedText } from "@/shared/ui/ThemedText";
import { CoursePriceListParams } from "../../course-price/api/course-price.dto";
import { coursePriceApi } from "../../course-price/api/coursePriceApi";

export function CourseCatalogScreen({
  initialTab = "registration",
}: {
  initialTab?: CourseCatalogTab;
}) {
  const router = useRouter();
  const state = getCommerceState();
  const [tab, setTab] = useState<CourseCatalogTab>(initialTab);
  const [packageCourse, setPackageCourse] = useState<CourseView | undefined>();

  const courses = useMemo(
    () => getCoursesForCatalogTab(state.courses, tab),
    [state.courses, tab],
  );

  const [params, setParams] = useState<CoursePriceListParams>({
    page: 0,
    size: 10,
  });
  // Dùng hook chung useGetQuery
  const { data, isLoading, isError, error, refetch } = useGetQuery(
    ["course-prices", params], // queryKey (được tự động trigger lại khi params thay đổi)
    () => coursePriceApi.list(params), // queryFn
  );
  // TypeScript tự suy luận data có kiểu PageResponse<CoursePriceSimpleResponse>
  const coursePrices = data?.content ?? [];
  if (isLoading) {
    return <ActivityIndicator style={{ marginTop: 20 }} />;
  }
  if (isError) {
    return <ThemedText>Có lỗi xảy ra: {error?.message}</ThemedText>;
  }

  return (
    <>
      <StackScreenLayout
        title="Khóa học"
        contentContainerStyle={styles.content}
      >
        <SegmentedTabs
          value={tab}
          tabs={COURSE_CATALOG_TABS}
          onChange={setTab}
        />
        <CourseCatalogSearchField tab={tab} />
        <CourseCatalogList
          courses={courses}
          tab={tab}
          onCoursePress={(courseId) =>
            router.push(asHref(`/courses/${courseId}`))
          }
          onPackagePress={setPackageCourse}
        />
      </StackScreenLayout>
      <PackageSheet
        visible={Boolean(packageCourse)}
        course={packageCourse}
        onClose={() => setPackageCourse(undefined)}
        onOpenPackage={(packageId) => {
          const courseId = packageCourse?.courseId;
          setPackageCourse(undefined);
          if (courseId) {
            router.push(asHref(`/courses/${courseId}/packages/${packageId}`));
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 20,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
});
