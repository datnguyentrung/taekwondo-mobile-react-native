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
  return query;
}

export function useCoachAssignments(personId?: string) {
  const query = useInfinitePageQuery({
    queryKey: ["course-staff-assignments", "by-person", personId ?? ""],
    enabled: Boolean(personId),
    fetchPage: ({ page, size, signal }) => courseStaffAssignmentApi.list({ staffPersonId: personId, page, size, sort: "startDate,desc" }, { signal }),
    getItemId: (item) => item.courseStaffAssignmentId,
  });
  return query;
}
