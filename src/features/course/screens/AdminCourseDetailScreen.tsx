import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { courseApi } from "@/features/course/api/courseApi";
import type { CourseResponse } from "@/features/course/api/course.dto";
import type { CourseStatus } from "@/features/course/constants/course.constants";
import { mapCourseApiToView } from "@/features/course/domain/course.mappers";
import { CourseActionButtons } from "@/features/course/components/CourseActionButtons";
import { CourseEditSheet } from "@/features/course/components/CourseEditSheet";
import type { CourseRouteProps, CourseView } from "@/features/student-commerce/types";
import {
  asHref,
  getCommerceState,
  getCourse,
} from "@/features/student-commerce/utils/studentCommerceUtils";
import { useScreenRefresh } from "@/infrastructure/query/useScreenRefresh";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { useGetQuery } from "@/shared/hooks/useCrud";
import { CancellableLoadingOverlay } from "@/shared/ui/CancellableLoadingOverlay";
import { ConfirmationDialog } from "@/shared/ui/ConfirmationDialog";
import { useToast } from "@/shared/ui/Toast";
import { Colors } from "@/theme";

import { CourseDetailContent } from "./CourseDetailContent";

export function AdminCourseDetailScreen({ courseId }: CourseRouteProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isEditSheetVisible, setIsEditSheetVisible] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteAbortControllerRef = useRef<AbortController | null>(null);

  const state = getCommerceState();
  const mockCourse = getCourse(state.courses, courseId);

  const courseQuery = useGetQuery(
    ["courses", courseId],
    () => courseApi.get(courseId!),
    {
      enabled: Boolean(courseId),
      retry: false,
    },
  );

  const { data: apiCourse, isLoading } = courseQuery;
  const { refreshing, onRefresh } = useScreenRefresh([courseQuery]);

  const course: CourseView = useMemo(() => {
    if (apiCourse) {
      // Map API CourseResponse to CourseView, reusing packages from mock if available
      return mapCourseApiToView(apiCourse, mockCourse?.packages ?? []);
    }
    return mockCourse;
  }, [apiCourse, mockCourse]);

  const registrationDisabled = course?.catalogStatus === "ended";

  const editInitialData = useMemo(() => {
    let defaultStatus: CourseStatus = "OPEN";
    if (apiCourse?.status) {
      defaultStatus = apiCourse.status;
    } else if (course?.catalogStatus === "active") {
      defaultStatus = "ACTIVE";
    }

    return {
      name: apiCourse?.name ?? course?.courseName ?? "",
      capacity: apiCourse?.capacity ?? course?.capacity ?? 20,
      status: defaultStatus,
    };
  }, [apiCourse, course]);

  const handleEditSuccess = (updatedCourse: CourseResponse) => {
    const activeId = course?.courseId ?? courseId;
    if (activeId) {
      queryClient.setQueryData(["courses", activeId], updatedCourse);
    }
    queryClient.invalidateQueries({ queryKey: ["courses"] });
  };

  const handleCancelDelete = useCallback(() => {
    if (deleteAbortControllerRef.current) {
      deleteAbortControllerRef.current.abort();
      deleteAbortControllerRef.current = null;
    }
    setIsDeleting(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const targetCourseId = course?.courseId ?? courseId;
    if (!targetCourseId) return;

    setIsDeleteDialogOpen(false);
    setIsDeleting(true);

    const abortController = new AbortController();
    deleteAbortControllerRef.current = abortController;

    try {
      await courseApi.remove(targetCourseId, { signal: abortController.signal });

      toast.show({
        message: "Xóa khóa học thành công",
        variant: "success",
      });

      queryClient.invalidateQueries({ queryKey: ["courses"] });
      router.back();
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") {
        return;
      }
      const message =
        error instanceof Error ? error.message : "Đã có lỗi xảy ra khi xóa khóa học";
      toast.show({
        message,
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
      deleteAbortControllerRef.current = null;
    }
  }, [course?.courseId, courseId, queryClient, router, toast]);

  return (
    <>
      <StackScreenLayout
        title="Chi tiết khóa học"
        contentContainerStyle={styles.content}
        refreshing={refreshing}
        onRefresh={onRefresh}
        floatingContent={
          <CourseActionButtons
            editTitle="Chỉnh sửa"
            editAccessibilityLabel="Chỉnh sửa khóa học"
            onEditPress={() => setIsEditSheetVisible(true)}
            registerTitle="Đăng ký học viên"
            registerAccessibilityLabel="Đăng ký học viên"
            registerDisabled={registrationDisabled}
            onRegisterPress={() =>
              router.push(asHref(`/courses/${course?.courseId ?? courseId}/register`))
            }
            onDeletePress={() => setIsDeleteDialogOpen(true)}
            deleteDisabled={isDeleting}
          />
        }
      >
        {course ? (
          <CourseDetailContent
            course={course}
            topContent={
              isLoading && !apiCourse ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                </View>
              ) : undefined
            }
            onOpenAssistants={() =>
              router.push(asHref(`/courses/${course.courseId}/assistants`))
            }
            onOpenStudents={() =>
              router.push(asHref(`/courses/${course.courseId}/students`))
            }
            onOpenPackage={(packageId) =>
              router.push(asHref(`/courses/${course.courseId}/packages/${packageId}`))
            }
          />
        ) : (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        )}
      </StackScreenLayout>

      <CourseEditSheet
        visible={isEditSheetVisible}
        courseId={course?.courseId ?? courseId ?? ""}
        initialData={editInitialData}
        onClose={() => setIsEditSheetVisible(false)}
        onSuccess={handleEditSuccess}
      />

      <ConfirmationDialog
        visible={isDeleteDialogOpen}
        title="Xóa khóa học"
        description={`Bạn có chắc chắn muốn xóa khóa học "${course?.courseName ?? 'này'}" không? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        confirmVariant="danger"
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      <CancellableLoadingOverlay
        visible={isDeleting}
        message="Đang xóa khóa học..."
        cancelLabel="Hủy"
        onCancel={handleCancelDelete}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 140,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});
