import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { PageResponse } from "../../../infrastructure/http/pagination.types";
import { useInfinitePageQuery } from "../../../infrastructure/query/useInfinitePageQuery";
import type {
  CourseStaffAssignmentCreateRequest,
  CourseStaffAssignmentSimpleResponse,
} from "../../course-staff-assignment/api/course-staff-assignment.dto";
import { courseStaffAssignmentApi } from "../../course-staff-assignment/api/courseStaffAssignmentApi";
import { courseCatalogKeys } from "../../course/queries/courseCatalogQueries";
import { personApi } from "../../person/api/personApi";
import type { StudentEnrollmentSimpleResponse } from "../../student-enrollment/api/student-enrollment.dto";
import { studentEnrollmentApi } from "../../student-enrollment/api/studentEnrollmentApi";

import {
  courseMemberConfig,
  groupStaffAssignments,
  groupStudentEnrollments,
  type CourseMemberKind,
} from "../domain/courseMemberRoster";

type RosterApiItem =
  | CourseStaffAssignmentSimpleResponse
  | StudentEnrollmentSimpleResponse;
type RosterApiPage = PageResponse<RosterApiItem>;

export const courseMemberRosterKeys = {
  all: ["course-member-roster"] as const,
  list: (courseId: string, memberKind: CourseMemberKind, search: string) =>
    [...courseMemberRosterKeys.all, courseId, memberKind, search] as const,
};

export function getLocalDate() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function useCourseMemberRoster(
  courseId: string,
  memberKind: CourseMemberKind,
  search: string,
) {
  const effectiveOn = getLocalDate();
  const query = useInfinitePageQuery<RosterApiItem>({
    queryKey: courseMemberRosterKeys.list(courseId, memberKind, search),
    fetchPage: ({ page, size, signal }) =>
      (memberKind === "students"
        ? studentEnrollmentApi.list(
            {
              courseId,
              from: effectiveOn,
              to: effectiveOn,
              status: "ACTIVE",
              search: search || undefined,
              page,
              size,
              sort: "studentPerson.fullName,asc",
            },
            { signal },
          )
        : courseStaffAssignmentApi.list(
            {
              courseId,
              assignmentTypes: courseMemberConfig[memberKind].assignmentTypes,
              effectiveOn,
              search: search || undefined,
              page,
              size,
              sort: "staffPerson.fullName,asc",
            },
            { signal },
          )) as Promise<RosterApiPage>,
    getItemId: (item) =>
      "studentEnrollmentId" in item
        ? item.studentEnrollmentId
        : item.courseStaffAssignmentId,
  });

  const rawItems = query.items;
  const members =
    memberKind === "students"
      ? groupStudentEnrollments(rawItems as StudentEnrollmentSimpleResponse[])
      : groupStaffAssignments(
          rawItems as CourseStaffAssignmentSimpleResponse[],
        );

  return { ...query, members };
}

export function useStaffCandidates(search: string, enabled: boolean) {
  return useQuery({
    queryKey: ["course-member-roster", "staff-candidates", search],
    queryFn: () =>
      personApi.list({
        search: search || undefined,
        status: "ACTIVE",
        isStudent: false,
        page: 0,
        size: 100,
        sort: "fullName,asc",
      }),
    enabled,
  });
}

export function useCreateCourseStaffAssignment(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      request,
      signal,
    }: {
      request: CourseStaffAssignmentCreateRequest;
      signal?: AbortSignal;
    }) => courseStaffAssignmentApi.create(request, { signal }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseMemberRosterKeys.all }),
        queryClient.invalidateQueries({
          queryKey: courseCatalogKeys.detail(courseId),
        }),
      ]);
    },
  });
}
