import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { FaceScanSquare } from "reicon-react-native";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { Permission, useCan } from "@/features/authorization";
import { DefaultHeaderActions } from "@/routes/navigation/components/DefaultHeaderActions";
import { HeaderActionButton } from "@/routes/navigation/components/HeaderActionButton";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast/ToastProvider";
import { Colors, activeEffect, radii } from "@/theme";

import type { EvaluationStudent } from "../api/session-attendance.dto";
import { AttendanceToolbar } from "../components/AttendanceToolbar";
import { ClassSessionOverviewCard } from "../components/ClassSessionOverviewCard";
import { EvaluationNoteSheet } from "../components/EvaluationNoteSheet";
import { StudentAttendanceCard } from "../components/StudentAttendanceCard";
import type { EvaluationStatus } from "../constants/session-attendance.constants";
import type {
  AttendanceFilter,
  BeltFilter,
  BeltSort,
} from "../domain/sessionAttendancePresentation";
import {
  filterAndSortStudents,
  getAvailableBelts,
} from "../domain/sessionAttendancePresentation";
import { useSessionAttendance } from "../hooks/useSessionAttendance";

export function SessionAttendanceScreen({
  classSessionId,
}: {
  classSessionId?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const canCreate = useCan(Permission.SESSION_ATTENDANCE_CREATE);
  const canUpdate = useCan(Permission.SESSION_ATTENDANCE_UPDATE);
  const [attendanceFilter, setAttendanceFilter] =
    useState<AttendanceFilter>("ALL");
  const [beltFilter, setBeltFilter] = useState<BeltFilter>("ALL");
  const [beltSort, setBeltSort] = useState<BeltSort>("ASC");
  const [evaluationTargetId, setEvaluationTargetId] = useState<string | null>(
    null,
  );
  const handleUpdateError = useCallback(
    (message?: string) => {
      toast.show({
        message:
          message ||
          "Không thể cập nhật điểm danh hoặc đánh giá. Vui lòng thử lại.",
        variant: "error",
      });
    },
    [toast],
  );
  const {
    data,
    isLoading,
    isError,
    refetch,
    isRefetching,
    students,
    stats,
    pendingStudentIds,
    updateAttendanceStatus,
    updateEvaluationStatus,
  } = useSessionAttendance({
    classSessionId,
    onUpdateError: handleUpdateError,
  });

  const availableBelts = useMemo(() => getAvailableBelts(students), [students]);
  const hasUnknownBelt = useMemo(
    () =>
      students.some(
        (student) => !student.studentEnrollment.studentPerson.currentBelt,
      ),
    [students],
  );
  const visibleStudents = useMemo(
    () =>
      filterAndSortStudents(students, attendanceFilter, beltFilter, beltSort),
    [attendanceFilter, beltFilter, beltSort, students],
  );
  const evaluationTarget = useMemo(
    () =>
      students.find(
        (student) =>
          student.studentEnrollment.studentEnrollmentId === evaluationTargetId,
      ) ?? null,
    [evaluationTargetId, students],
  );

  const saveEvaluationNote = useCallback(
    async (status: EvaluationStatus, note: string | null) => {
      if (!evaluationTarget) return false;
      const saved = await updateEvaluationStatus(
        evaluationTarget.studentEnrollment.studentEnrollmentId,
        status,
        note,
      );
      if (saved) {
        toast.show({
          message: "Đã lưu nhận xét buổi học.",
          variant: "success",
        });
      }
      return saved;
    },
    [evaluationTarget, toast, updateEvaluationStatus],
  );

  return (
    <StackScreenLayout
      title="Đánh giá"
      scrollEnabled={false}
      contentContainerStyle={styles.container}
      rightActions={
        <>
          <HeaderActionButton
            icon={<FaceScanSquare />}
            label="Quét khuôn mặt"
            onPress={() =>
              router.navigate({
                pathname: "/check-in",
                params: classSessionId
                  ? { returnToClassSessionId: classSessionId }
                  : undefined,
              })
            }
            testID="session-attendance-face-scan-button"
          />
          <DefaultHeaderActions />
        </>
      }
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
            style={({ pressed }) => [
              styles.retryButton,
              activeEffect(pressed, "pressedScale"),
            ]}
          >
            <ThemedText type="bodySmall" style={styles.retryText}>
              Thử lại
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={visibleStudents}
            extraData={pendingStudentIds}
            keyExtractor={(item) => item.studentEnrollment.studentEnrollmentId}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={async () => {
                  await refetch();
                }}
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
                <AttendanceToolbar
                  attendanceFilter={attendanceFilter}
                  beltFilter={beltFilter}
                  availableBelts={availableBelts}
                  hasUnknownBelt={hasUnknownBelt}
                  beltSort={beltSort}
                  onAttendanceFilterChange={setAttendanceFilter}
                  onBeltFilterChange={setBeltFilter}
                  onBeltSortChange={() =>
                    setBeltSort((current) =>
                      current === "ASC" ? "DESC" : "ASC",
                    )
                  }
                />
                <View style={styles.sectionHeader}>
                  <ThemedText type="title" style={styles.sectionTitle}>
                    Danh sách võ sinh ({visibleStudents.length}/
                    {students.length})
                  </ThemedText>
                  <ThemedText type="caption" style={styles.sectionHint}>
                    {canCreate || canUpdate
                      ? "Chạm để cập nhật"
                      : "Chỉ có quyền xem"}
                  </ThemedText>
                </View>
              </View>
            }
            renderItem={({ item }: { item: EvaluationStudent }) => {
              const studentEnrollmentId =
                item.studentEnrollment.studentEnrollmentId;
              return (
                <StudentAttendanceCard
                  item={item}
                  canCreate={canCreate}
                  canUpdate={canUpdate}
                  isPending={pendingStudentIds.has(studentEnrollmentId)}
                  onUpdateAttendanceStatus={(newStatus) =>
                    updateAttendanceStatus(studentEnrollmentId, newStatus)
                  }
                  onUpdateEvaluationStatus={(newStatus) =>
                    updateEvaluationStatus(studentEnrollmentId, newStatus)
                  }
                  onOpenEvaluationNote={() =>
                    setEvaluationTargetId(studentEnrollmentId)
                  }
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyListBox}>
                <ThemedText type="body" style={styles.emptyTitle}>
                  {students.length === 0
                    ? "Chưa có học viên nào trong lớp"
                    : "Không có học viên phù hợp bộ lọc"}
                </ThemedText>
                <ThemedText type="bodySmall" style={styles.emptyDescription}>
                  {students.length === 0
                    ? "Lớp học này hiện chưa có học viên đăng ký hoạt động."
                    : "Hãy đổi trạng thái điểm danh hoặc cấp đai đang lọc."}
                </ThemedText>
              </View>
            }
            contentContainerStyle={styles.listContent}
          />

          <EvaluationNoteSheet
            student={evaluationTarget}
            visible={Boolean(evaluationTarget)}
            saving={
              evaluationTarget
                ? pendingStudentIds.has(
                    evaluationTarget.studentEnrollment.studentEnrollmentId,
                  )
                : false
            }
            onClose={() => setEvaluationTargetId(null)}
            onSave={saveEvaluationNote}
          />
        </>
      )}
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 0 },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerWrap: { gap: 20, marginBottom: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: { flex: 1, color: Colors.light.text },
  sectionHint: { color: Colors.light.textSecondary },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  loadingText: { color: Colors.light.textSecondary, textAlign: "center" },
  emptyTitle: {
    color: Colors.light.text,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDescription: { color: Colors.light.textSecondary, textAlign: "center" },
  retryButton: {
    minHeight: 44,
    marginTop: 8,
    justifyContent: "center",
    paddingHorizontal: 18,
    backgroundColor: Colors.light.primary,
    borderRadius: radii.md,
  },
  retryText: { color: Colors.light.surface, fontWeight: "600" },
  emptyListBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    gap: 8,
  },
});
