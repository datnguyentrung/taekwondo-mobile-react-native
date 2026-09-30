import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast/ToastProvider";
import { Colors, radii } from "@/theme";

import { sessionAttendanceApi } from "../api/sessionAttendanceApi";
import type {
  ClassSessionEvaluationResponse,
} from "../api/session-attendance.dto";
import type {
  AttendanceStatus,
  EvaluationStatus,
} from "../constants/session-attendance.constants";
import {
  AttendanceProgressStats,
  ClassSessionOverviewCard,
} from "../components/ClassSessionOverviewCard";
import { StudentAttendanceCard } from "../components/StudentAttendanceCard";

export function SessionAttendanceScreen({
  classSessionId,
}: {
  classSessionId?: string;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ["session-evaluation", classSessionId],
    [classSessionId],
  );

  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery<ClassSessionEvaluationResponse>({
    queryKey,
    queryFn: () => sessionAttendanceApi.getEvaluation(classSessionId as string),
    enabled: Boolean(classSessionId),
  });

  const students = useMemo(() => data?.students ?? [], [data?.students]);

  // Compute live progress stats based on students list
  const stats: AttendanceProgressStats = useMemo(() => {
    const totalStudents = students.length;
    const presentCount = students.filter((s) => {
      const status = s.attendance?.attendanceStatus;
      return status === "PRESENT" || status === "LATE" || status === "MAKEUP";
    }).length;

    const absentCount = students.filter((s) => {
      const status = s.attendance?.attendanceStatus;
      return status === "ABSENT" || status === "EXCUSED";
    }).length;

    const attendancePercent =
      totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    // Evaluated: any student with evaluation status not PENDING
    const evaluatedCount = students.filter(
      (s) =>
        s.attendance?.evaluationStatus &&
        s.attendance.evaluationStatus !== "PENDING",
    ).length;

    const needEvaluationCount = presentCount || totalStudents;
    const evaluationPercent =
      needEvaluationCount > 0
        ? Math.round((evaluatedCount / needEvaluationCount) * 100)
        : 0;

    return {
      totalStudents,
      presentCount,
      absentCount,
      attendancePercent,
      evaluatedCount,
      needEvaluationCount,
      evaluationPercent,
    };
  }, [students]);

  // Optimistic update for Attendance Status via QueryClient cache
  const handleUpdateAttendance = async (
    studentEnrollmentId: string,
    newStatus: AttendanceStatus,
  ) => {
    if (!classSessionId) return;

    const previousData =
      queryClient.getQueryData<ClassSessionEvaluationResponse>(queryKey);
    if (!previousData) return;

    const targetStudent = previousData.students.find(
      (s) => s.studentEnrollment.studentEnrollmentId === studentEnrollmentId,
    );
    if (!targetStudent) return;

    const previousAttendance = targetStudent.attendance;

    // Optimistically update React Query Cache
    queryClient.setQueryData<ClassSessionEvaluationResponse>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        students: old.students.map((item) => {
          if (
            item.studentEnrollment.studentEnrollmentId !== studentEnrollmentId
          ) {
            return item;
          }
          return {
            ...item,
            attendance: {
              sessionAttendanceId:
                previousAttendance?.sessionAttendanceId ?? "",
              checkInTime:
                previousAttendance?.checkInTime ?? new Date().toISOString(),
              attendanceStatus: newStatus,
              evaluationStatus:
                previousAttendance?.evaluationStatus ?? "PENDING",
              note: previousAttendance?.note ?? "",
            },
            recorded: true,
          };
        }),
      };
    });

    // Call API in background
    try {
      if (previousAttendance?.sessionAttendanceId) {
        await sessionAttendanceApi.updateStatus(
          previousAttendance.sessionAttendanceId,
          {
            attendanceStatus: newStatus,
            checkInTime: new Date().toISOString(),
          },
        );
      } else {
        const created = await sessionAttendanceApi.create({
          classSessionId,
          studentEnrollmentId,
          attendanceStatus: newStatus,
          evaluationStatus: "PENDING",
          checkInTime: new Date().toISOString(),
          note: "",
        });

        // Update with real sessionAttendanceId from server
        queryClient.setQueryData<ClassSessionEvaluationResponse>(
          queryKey,
          (old) => {
            if (!old) return old;
            return {
              ...old,
              students: old.students.map((item) =>
                item.studentEnrollment.studentEnrollmentId ===
                studentEnrollmentId
                  ? {
                      ...item,
                      attendance: {
                        sessionAttendanceId: created.sessionAttendanceId,
                        checkInTime: created.checkInTime,
                        attendanceStatus: created.attendanceStatus,
                        evaluationStatus: created.evaluationStatus,
                        note: created.note,
                      },
                      recorded: true,
                    }
                  : item,
              ),
            };
          },
        );
      }
    } catch (error) {
      // Rollback cache on failure
      queryClient.setQueryData(queryKey, previousData);
      toast.show({
        message: "Không thể cập nhật điểm danh. Vui lòng thử lại.",
        variant: "error",
      });
    }
  };

  // Optimistic update for Evaluation Status via QueryClient cache
  const handleUpdateEvaluation = async (
    studentEnrollmentId: string,
    newStatus: EvaluationStatus,
  ) => {
    if (!classSessionId) return;

    const previousData =
      queryClient.getQueryData<ClassSessionEvaluationResponse>(queryKey);
    if (!previousData) return;

    const targetStudent = previousData.students.find(
      (s) => s.studentEnrollment.studentEnrollmentId === studentEnrollmentId,
    );
    if (!targetStudent) return;

    const previousAttendance = targetStudent.attendance;

    // Optimistically update React Query Cache
    queryClient.setQueryData<ClassSessionEvaluationResponse>(queryKey, (old) => {
      if (!old) return old;
      return {
        ...old,
        students: old.students.map((item) => {
          if (
            item.studentEnrollment.studentEnrollmentId !== studentEnrollmentId
          ) {
            return item;
          }
          return {
            ...item,
            attendance: {
              sessionAttendanceId:
                previousAttendance?.sessionAttendanceId ?? "",
              checkInTime:
                previousAttendance?.checkInTime ?? new Date().toISOString(),
              attendanceStatus:
                previousAttendance?.attendanceStatus ?? "PRESENT",
              evaluationStatus: newStatus,
              note: previousAttendance?.note ?? "",
            },
            recorded: true,
          };
        }),
      };
    });

    // Call API in background
    try {
      if (previousAttendance?.sessionAttendanceId) {
        await sessionAttendanceApi.updateEvaluation(
          previousAttendance.sessionAttendanceId,
          {
            evaluationStatus: newStatus,
          },
        );
      } else {
        const created = await sessionAttendanceApi.create({
          classSessionId,
          studentEnrollmentId,
          attendanceStatus: "PRESENT",
          evaluationStatus: newStatus,
          checkInTime: new Date().toISOString(),
          note: "",
        });

        // Update with real sessionAttendanceId from server
        queryClient.setQueryData<ClassSessionEvaluationResponse>(
          queryKey,
          (old) => {
            if (!old) return old;
            return {
              ...old,
              students: old.students.map((item) =>
                item.studentEnrollment.studentEnrollmentId ===
                studentEnrollmentId
                  ? {
                      ...item,
                      attendance: {
                        sessionAttendanceId: created.sessionAttendanceId,
                        checkInTime: created.checkInTime,
                        attendanceStatus: created.attendanceStatus,
                        evaluationStatus: created.evaluationStatus,
                        note: created.note,
                      },
                      recorded: true,
                    }
                  : item,
              ),
            };
          },
        );
      }
    } catch (error) {
      // Rollback cache on failure
      queryClient.setQueryData(queryKey, previousData);
      toast.show({
        message: "Không thể cập nhật đánh giá. Vui lòng thử lại.",
        variant: "error",
      });
    }
  };

  return (
    <StackScreenLayout
      title="Điểm danh & Đánh giá"
      scrollEnabled={false}
      contentContainerStyle={styles.container}
    >
      {!classSessionId ? (
        <View style={styles.centerBox}>
          <ThemedText type="body" style={styles.emptyTitle}>
            Thiếu mã buổi tập
          </ThemedText>
        </View>
      ) : isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText type="bodySmall" style={styles.loadingText}>
            Đang tải dữ liệu buổi tập...
          </ThemedText>
        </View>
      ) : isError || !data ? (
        <View style={styles.centerBox}>
          <ThemedText type="body" style={styles.emptyTitle}>
            Không thể tải thông tin buổi tập
          </ThemedText>
          <ThemedText type="bodySmall" style={styles.emptyDescription}>
            Đã xảy ra lỗi kết nối. Vui lòng thử lại.
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Thử lại"
            onPress={() => refetch()}
            style={styles.retryButton}
          >
            <ThemedText type="bodySmall" style={styles.retryText}>
              Thử lại
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.studentEnrollment.studentEnrollmentId}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
          ListHeaderComponent={
            <View style={styles.headerWrap}>
              <ClassSessionOverviewCard
                classSession={data.classSession}
                stats={stats}
              />

              <View style={styles.sectionHeader}>
                <ThemedText type="subtitle" style={styles.sectionTitle}>
                  Danh sách võ sinh ({students.length})
                </ThemedText>
                <ThemedText type="caption" style={styles.sectionHint}>
                  Chạm để đổi trạng thái
                </ThemedText>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <StudentAttendanceCard
              item={item}
              onUpdateAttendanceStatus={(newStatus) =>
                handleUpdateAttendance(
                  item.studentEnrollment.studentEnrollmentId,
                  newStatus,
                )
              }
              onUpdateEvaluationStatus={(newStatus) =>
                handleUpdateEvaluation(
                  item.studentEnrollment.studentEnrollmentId,
                  newStatus,
                )
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyListBox}>
              <ThemedText type="body" style={styles.emptyTitle}>
                Chưa có học viên nào trong lớp
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.emptyDescription}>
                Lớp học này hiện chưa có học viên nào đăng ký hoạt động.
              </ThemedText>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerWrap: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.light.text,
  },
  sectionHint: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  centerBox: {
    paddingTop: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: {
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  emptyTitle: {
    color: Colors.light.text,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDescription: {
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.primary,
    borderRadius: radii.md,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  emptyListBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    gap: 8,
  },
});
