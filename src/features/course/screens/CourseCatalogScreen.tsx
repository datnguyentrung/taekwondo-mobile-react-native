import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet } from "react-native";

import { CourseCatalogList } from "@/features/course/components/CourseCatalogList";
import { CourseCatalogSearchField } from "@/features/course/components/CourseCatalogSearchField";
import {
  COURSE_CATALOG_TABS,
  getCoursesForCatalogTab,
} from "@/features/course/utils/courseCatalogViewModel";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
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

  return (
    <>
      <StackScreenLayout title="Khóa học" contentContainerStyle={styles.content}>
        <SegmentedTabs
          value={tab}
          tabs={COURSE_CATALOG_TABS}
          onChange={setTab}
        />
        <CourseCatalogSearchField tab={tab} />
        <CourseCatalogList
          courses={courses}
          tab={tab}
          onCoursePress={(courseId) => router.push(asHref(`/courses/${courseId}`))}
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
