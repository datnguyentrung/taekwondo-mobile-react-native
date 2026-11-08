import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useInfinitePageQuery } from "@/infrastructure/query/useInfinitePageQuery";

import { courseApi } from "../api/courseApi";
import type { CourseCreateRequest, CourseResponse, CourseScheduleResponse, CourseScheduleUpsertRequest, CourseUpdateRequest } from "../api/course.dto";
import { classScheduleApi } from "@/features/class-schedule/api/classScheduleApi";
import { mapCourseApiToView } from "../domain/course.mappers";
import type { CourseCatalogTab } from "../domain/course.types";

export const courseCatalogKeys = {
  all: ["courses"] as const,
  list: () => [...courseCatalogKeys.all, "list"] as const,
  detail: (courseId: string) => [...courseCatalogKeys.all, courseId] as const,
};

export function useCourseCatalog(tab: CourseCatalogTab, search: string) {
  const queryClient = useQueryClient();
  const status = tab === "registration" ? "OPEN" : tab === "active" ? "ACTIVE" : undefined;
  const normalizedSearch = search.trim();
  const query = useInfinitePageQuery({
    queryKey: [...courseCatalogKeys.list(), "infinite", { tab, status, search: normalizedSearch || undefined }],
    fetchPage: ({ page, size, signal }) => courseApi.list({ page, size, status, search: normalizedSearch || undefined, sort: "name,asc" }, { signal }),
    getItemId: (course) => course.courseId,
  });
  const courses = useMemo(() => {
    const rawList = query.items.map((item) => mapCourseApiToView(item));
    return rawList.filter((course) => course.catalogStatus === tab);
  }, [query.items, tab]);
  const registerCreatedCourse = useCallback(
    async (createdCourse: CourseResponse) => {
      queryClient.setQueryData(
        courseCatalogKeys.detail(createdCourse.courseId),
        createdCourse,
      );
      await queryClient.invalidateQueries({ queryKey: courseCatalogKeys.all });
    },
    [queryClient],
  );

  return { ...query, courses, registerCreatedCourse };
}

export function useCourseDetail(courseId?: string) {
  return useQuery({
    queryKey: courseCatalogKeys.detail(courseId ?? ""),
    queryFn: () => courseApi.get(courseId as string),
    enabled: Boolean(courseId),
    retry: false,
  });
}

export function useCourseCacheActions() {
  const queryClient = useQueryClient();
  return {
    registerCourse: async (course: CourseResponse) => {
      queryClient.setQueryData(courseCatalogKeys.detail(course.courseId), course);
      await queryClient.invalidateQueries({ queryKey: courseCatalogKeys.all });
    },
  };
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, signal }: { courseId: string; signal?: AbortSignal }) =>
      courseApi.remove(courseId, { signal }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: courseCatalogKeys.all });
    },
  });
}

export function useCourseCreateOptions(enabled: boolean) {
  return useQuery({
    queryKey: ["class-schedules", "course-create-options"],
    queryFn: () => classScheduleApi.list({ page: 0, size: 200 }),
    enabled,
  });
}

export function useCreateCourse() {
  return useMutation({
    mutationFn: ({ request, signal }: { request: CourseCreateRequest; signal?: AbortSignal }) =>
      courseApi.create(request, { signal }),
  });
}

export function useUpdateCourse() {
  return useMutation({
    mutationFn: ({ courseId, request, signal }: {
      courseId: string;
      request: CourseUpdateRequest;
      signal?: AbortSignal;
    }) => courseApi.update(courseId, request, { signal }),
  });
}

export function useUpdateCourseSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseScheduleId, request, signal }: {
      courseId: string;
      courseScheduleId: string;
      request: CourseScheduleUpsertRequest;
      signal?: AbortSignal;
    }) => courseApi.updateSchedule(courseScheduleId, request, { signal }),
    onSuccess: async (schedule: CourseScheduleResponse, variables) => {
      const { courseId } = variables;
      queryClient.setQueryData<CourseResponse>(courseCatalogKeys.detail(courseId), (course) =>
        course ? {
          ...course,
          courseSchedules: course.courseSchedules.map((item) =>
            item.courseScheduleId === schedule.courseScheduleId ? schedule : item,
          ),
        } : course,
      );
      await queryClient.invalidateQueries({ queryKey: courseCatalogKeys.all });
    },
  });
}

export function useAddCourseSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, request }: {
      courseId: string;
      request: CourseScheduleUpsertRequest;
    }) => courseApi.addSchedule(courseId, request),
    onSuccess: async (schedule: CourseScheduleResponse, { courseId }) => {
      queryClient.setQueryData<CourseResponse>(courseCatalogKeys.detail(courseId), (course) =>
        course
          ? { ...course, courseSchedules: [...course.courseSchedules, schedule] }
          : course,
      );
      await queryClient.invalidateQueries({ queryKey: courseCatalogKeys.all });
    },
  });
}

export function useDeleteCourseSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, courseScheduleId, signal }: {
      courseId: string;
      courseScheduleId: string;
      signal?: AbortSignal;
    }) =>
      courseApi.removeSchedule(courseScheduleId, { signal }),
    onSuccess: (_result, { courseId, courseScheduleId }) => {
      queryClient.setQueryData<CourseResponse>(courseCatalogKeys.detail(courseId), (course) =>
        course
          ? {
              ...course,
              courseSchedules: course.courseSchedules.filter(
                (schedule) => schedule.courseScheduleId !== courseScheduleId,
              ),
            }
          : course,
      );
      void queryClient.invalidateQueries({ queryKey: courseCatalogKeys.all });
    },
  });
}
