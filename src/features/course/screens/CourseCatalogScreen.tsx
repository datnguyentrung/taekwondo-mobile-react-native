import { useRouter } from "expo-router";
import { useState } from "react";

import {
  CourseCatalogCard,
  FormField,
  PackageSheet,
  RootLikeScreen,
  SegmentedTabs,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import type { CourseCatalogTab, CourseView } from "@/features/student-commerce/types";
import {
  asHref,
  filterCoursesByCatalogTab,
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
  const courses = filterCoursesByCatalogTab(state.courses, tab);

  return (
    <RootLikeScreen title="Khóa học" activeTab="activities">
      <SegmentedTabs
        value={tab}
        tabs={[
          { value: "registration", label: "Đăng ký" },
          { value: "active", label: "Đang diễn ra" },
          { value: "ended", label: "Đã kết thúc" },
        ]}
        onChange={setTab}
      />
      <FormField
        label="Tìm kiếm"
        value={
          tab === "registration"
            ? "Tên khóa học, cơ sở..."
            : "Tên khóa học, HLV..."
        }
        editable={false}
      />
      {courses.map((course) => (
        <CourseCatalogCard
          key={course.courseId}
          course={course}
          mode={tab}
          onPress={() => router.push(asHref(`/courses/${course.courseId}`))}
          onPackagePress={() => setPackageCourse(course)}
        />
      ))}
      <PackageSheet
        visible={Boolean(packageCourse)}
        course={packageCourse}
        onClose={() => setPackageCourse(undefined)}
        onOpenPackage={(packageId) => {
          const courseId = packageCourse?.courseId;
          setPackageCourse(undefined);
          if (courseId)
            router.push(asHref(`/courses/${courseId}/packages/${packageId}`));
        }}
      />
    </RootLikeScreen>
  );
}
