import { CourseCatalogCard } from "@/features/student-commerce/components/StudentCommercePrimitives";
import type {
  CourseCatalogTab,
  CourseView,
} from "@/features/student-commerce/types";

export function CourseCatalogList({
  courses,
  tab,
  onCoursePress,
  onPackagePress,
}: {
  courses: CourseView[];
  tab: CourseCatalogTab;
  onCoursePress: (courseId: string) => void;
  onPackagePress: (course: CourseView) => void;
}) {
  return (
    <>
      {courses.map((course) => (
        <CourseCatalogCard
          key={course.courseId}
          course={course}
          mode={tab}
          onPress={() => onCoursePress(course.courseId)}
          onPackagePress={() => onPackagePress(course)}
        />
      ))}
    </>
  );
}
