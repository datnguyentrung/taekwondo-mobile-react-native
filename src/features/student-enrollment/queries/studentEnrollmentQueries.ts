import { useQueries } from "@tanstack/react-query";

import { courseApi } from "@/features/course/api/courseApi";
import { courseCatalogKeys } from "@/features/course/queries/courseCatalogQueries";
import { useInfinitePageQuery } from "@/infrastructure/query/useInfinitePageQuery";

import { studentEnrollmentApi } from "../api/studentEnrollmentApi";
import { courseStaffAssignmentApi } from "@/features/course-staff-assignment/api/courseStaffAssignmentApi";

const FROM = "2000-01-01";
const TO = "2100-12-31";

export function useStudentEnrollments(personId?: string) {
  const query = useInfinitePageQuery({
    queryKey: ["student-enrollments", "by-person", personId ?? ""],
    enabled: Boolean(personId),
    fetchPage: ({ page, size, signal }) =>
      studentEnrollmentApi.list({ from: FROM, to: TO, studentPersonId: personId, page, size, sort: "startDate,desc" }, { signal }),
    getItemId: (item) => item.studentEnrollmentId,
  });
  const courseIds = Array.from(new Set(query.items.flatMap((item) => item.courseSchedules.map((schedule) => schedule.courseId).filter((id): id is string => Boolean(id)))));
  const courseQueries = useQueries({ queries: courseIds.map((courseId) => ({ queryKey: courseCatalogKeys.detail(courseId), queryFn: () => courseApi.get(courseId), staleTime: 30_000 })) });
  const courseNames = new Map(courseIds.map((id, index) => [id, courseQueries[index]?.data?.name ?? id]));
  return { ...query, courseNames };
}

export function useCoachAssignments(personId?: string) {
  const query = useInfinitePageQuery({
    queryKey: ["course-staff-assignments", "by-person", personId ?? ""],
    enabled: Boolean(personId),
    fetchPage: ({ page, size, signal }) => courseStaffAssignmentApi.list({ staffPersonId: personId, page, size, sort: "startDate,desc" }, { signal }),
    getItemId: (item) => item.courseStaffAssignmentId,
  });
  const courseIds = Array.from(new Set(query.items.map((item) => item.courseSchedule.courseId).filter((id): id is string => Boolean(id))));
  const courseQueries = useQueries({ queries: courseIds.map((courseId) => ({ queryKey: courseCatalogKeys.detail(courseId), queryFn: () => courseApi.get(courseId), staleTime: 30_000 })) });
  const courseNames = new Map(courseIds.map((id, index) => [id, courseQueries[index]?.data?.name ?? id]));
  return { ...query, courseNames };
}
