import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet } from "react-native";

import { CourseCatalogList } from "@/features/course/components/CourseCatalogList";
import { CourseCatalogSearchField } from "@/features/course/components/CourseCatalogSearchField";
import {
  COURSE_CATALOG_TABS,
  getCoursesForCatalogTab,
} from "@/features/course/utils/courseCatalogViewModel";
import { SegmentedTabs } from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { CourseCatalogTab } from "@/features/student-commerce/types";
import {
  asHref,
  getCommerceState,
} from "@/features/student-commerce/utils/studentCommerceUtils";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";

export function CourseCatalogScreen({
  initialTab = "registration",
}: {
  initialTab?: CourseCatalogTab;
}) {
  const router = useRouter();
  const state = getCommerceState();
  const [tab, setTab] = useState<CourseCatalogTab>(initialTab);

  const courses = useMemo(
    () => getCoursesForCatalogTab(state.courses, tab),
    [state.courses, tab],
  );

  return (
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
        onCoursePress={(courseId) =>
          router.push(asHref(`/courses/${courseId}`))
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
    paddingBottom: 32,
  },
});
