import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import type { CourseStaffAssignmentSimpleResponse } from "@/features/course-staff-assignment/api/course-staff-assignment.dto";
import {
  EnrollmentCard,
  SegmentedTabs,
} from "@/features/student-commerce/components/StudentCommercePrimitives";
import type {
  CourseEnrollmentView,
  StudentCourseTab,
  StudentRouteProps,
} from "@/features/student-commerce/types";
import { asHref } from "@/features/student-commerce/utils/studentCommerceUtils";
import { MOBILE_LIST_END_REACHED_THRESHOLD } from "@/infrastructure/query/infiniteList.config";
import { useShortListPrefetch } from "@/infrastructure/query/useShortListPrefetch";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { InfiniteListFooter } from "@/shared/ui/InfiniteListFooter";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";
import type { StudentEnrollmentSimpleResponse } from "../api/student-enrollment.dto";
import { StudentEnrollmentStatusLabel } from "../constants/student-enrollment.constants";
import {
  useCoachAssignments,
  useStudentEnrollments,
} from "../queries/studentEnrollmentQueries";

const currentStatuses = new Set(["ACTIVE", "PENDING_START", "RESERVED"]);

function toCourseView(
  enrollment: StudentEnrollmentSimpleResponse,
  courseNames: Map<string, string>,
): CourseEnrollmentView {
  const schedule = enrollment.courseSchedules[0];
  const classSchedule = schedule?.classSchedule;
  const courseId = schedule?.courseId ?? enrollment.studentEnrollmentId;
  return {
    enrollmentId: enrollment.studentEnrollmentId,
    courseId,
    courseName: courseNames.get(courseId) ?? courseId,
    branchName: classSchedule?.branch?.name ?? "",
    statusLabel: StudentEnrollmentStatusLabel[enrollment.status],
    scheduleLabel: classSchedule
      ? `${classSchedule.weekday} · ${classSchedule.startTime}–${classSchedule.endTime}`
      : "Chưa có lịch học",
    packageLabel: "Gói học",
    usedSessions: 0,
    totalSessions: 0,
    coachName: "",
    dateRangeLabel: `${enrollment.startDate} → ${enrollment.endDate}`,
    tuitionFee: 0,
    history: !currentStatuses.has(enrollment.status),
  };
}

function toCoachCourseView(
  assignment: CourseStaffAssignmentSimpleResponse,
  courseNames: Map<string, string>,
): CourseEnrollmentView {
  const schedule = assignment.courseSchedule;
  const classSchedule = schedule.classSchedule;
  const courseId = schedule.courseId ?? assignment.courseStaffAssignmentId;
  return {
    enrollmentId: assignment.courseStaffAssignmentId,
    courseId,
    courseName: courseNames.get(courseId) ?? courseId,
    branchName: classSchedule?.branch?.name ?? "",
    statusLabel: assignment.assignmentStatus,
    scheduleLabel: classSchedule
      ? `${classSchedule.weekday} · ${classSchedule.startTime}–${classSchedule.endTime}`
      : "Chưa có lịch học",
    packageLabel: "Phân công HLV",
    usedSessions: 0,
    totalSessions: 0,
    coachName: "",
    dateRangeLabel: `${assignment.startDate} → ${assignment.endDate ?? "nay"}`,
    tuitionFee: 0,
    history: !["ACTIVE", "PENDING"].includes(assignment.assignmentStatus),
  };
}

export function StudentCoursesScreen({
  studentCode,
  personType = "student",
}: StudentRouteProps) {
  const router = useRouter();
  const [tab, setTab] = useState<StudentCourseTab>("current");
  const studentQuery = useStudentEnrollments(
    personType === "student" ? studentCode : undefined,
  );
  const coachQuery = useCoachAssignments(
    personType === "coach" ? studentCode : undefined,
  );
  const query = personType === "coach" ? coachQuery : studentQuery;
  const enrollments = useMemo(
    () =>
      personType === "coach"
        ? coachQuery.items.map((item) =>
            toCoachCourseView(item, coachQuery.courseNames),
          )
        : studentQuery.items.map((item) =>
            toCourseView(item, studentQuery.courseNames),
          ),
    [
      coachQuery.courseNames,
      coachQuery.items,
      personType,
      studentQuery.courseNames,
      studentQuery.items,
    ],
  );
  const visible = enrollments.filter((item) =>
    tab === "history" ? item.history : !item.history,
  );
  const prefetch = useShortListPrefetch({
    identity: `${studentCode}:${tab}`,
    hasNextPage: Boolean(query.hasNextPage),
    isFetchingNextPage: query.isFetchingNextPage,
    loadNextPage: query.loadNextPage,
  });

  return (
    <StackScreenLayout
      title="Khóa học"
      scrollEnabled={false}
      refreshEnabled={false}
    >
      <FlatList
        data={visible}
        keyExtractor={(item) => item.enrollmentId}
        renderItem={({ item }) => (
          <EnrollmentCard
            enrollment={item}
            onPress={() =>
              router.push(
                asHref(`/students/${studentCode}/courses/${item.enrollmentId}`),
              )
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        showsVerticalScrollIndicator={false}
        onLayout={prefetch.onLayout}
        onContentSizeChange={prefetch.onContentSizeChange}
        onEndReached={() => void query.loadNextPage()}
        onEndReachedThreshold={MOBILE_LIST_END_REACHED_THRESHOLD}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefreshing}
            onRefresh={() => void query.refreshFirstPage()}
            tintColor={Colors.light.primary}
          />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <SegmentedTabs
              value={tab}
              tabs={[
                { value: "current", label: "Hiện tại" },
                { value: "history", label: "Lịch sử" },
              ]}
              onChange={setTab}
            />
            <ThemedText type="title" style={styles.blackText}>
              {visible.length} khóa học
            </ThemedText>
          </>
        }
        ListEmptyComponent={
          query.isInitialLoading ? (
            <ActivityIndicator color={Colors.light.primary} />
          ) : (
            <ThemedText type="bodySmall" style={styles.secondaryText}>
              Chưa có khóa học.
            </ThemedText>
          )
        }
        ListFooterComponent={
          <InfiniteListFooter
            hasItems={visible.length > 0}
            isLoading={query.isFetchingNextPage}
            isError={query.isLoadMoreError}
            onRetry={() => void query.retryNextPage()}
          />
        }
      />
    </StackScreenLayout>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 16, paddingBottom: 32, gap: 20 },
  gap: { height: 12 },
  blackText: { color: Colors.light.text },
  secondaryText: { color: Colors.light.textSecondary },
});
