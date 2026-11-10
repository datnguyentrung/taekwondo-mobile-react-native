import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { Tuning } from "reicon-react-native";

import {
  WeekdayLabel,
  type Weekday,
} from "@/features/class-schedule/constants/class-schedule.constants";
import type { CourseStaffAssignmentSimpleResponse } from "@/features/course-staff-assignment/api/course-staff-assignment.dto";
import {
  CourseLevelLabel,
  type CourseLevel,
} from "@/features/course/constants/course.constants";
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
import { DefaultHeaderActions } from "@/routes/navigation/components/DefaultHeaderActions";
import { HeaderActionButton } from "@/routes/navigation/components/HeaderActionButton";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { InfiniteListFooter } from "@/shared/ui/InfiniteListFooter";
import {
  FilterSheetActions,
  MultiSelectFilterContent,
  toggleMultiSelectFilterValue,
  type MultiSelectFilterGroup,
} from "@/shared/ui/MultiSelectFilterContent";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";
import type { StudentEnrollmentSimpleResponse } from "../api/student-enrollment.dto";
import { StudentEnrollmentStatusLabel } from "../constants/student-enrollment.constants";
import {
  useCoachAssignments,
  useStudentEnrollments,
} from "../queries/studentEnrollmentQueries";

type CourseFilterItem = CourseEnrollmentView & {
  weekdays: Weekday[];
  courseType?: string;
};

type CourseFilterState = {
  weekdays: Weekday[];
  courseTypes: string[];
};

const emptyFilters: CourseFilterState = {
  weekdays: [],
  courseTypes: [],
};

const WEEKDAY_ORDER: Weekday[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const currentStatuses = new Set(["ACTIVE", "PENDING_START", "RESERVED"]);

function toCourseView(
  enrollment: StudentEnrollmentSimpleResponse,
): CourseFilterItem {
  const schedule = enrollment.courseSchedules[0];
  const classSchedule = schedule?.classSchedule;
  const learningProgress = enrollment.courseSchedules.reduce(
    (progress, item) => ({
      scheduled: progress.scheduled + (item.learningProgress?.scheduled ?? 0),
      total: progress.total + (item.learningProgress?.total ?? 0),
    }),
    { scheduled: 0, total: 0 },
  );
  const courseId = schedule?.course?.courseId ?? enrollment.studentEnrollmentId;

  const weekdays = Array.from(
    new Set(
      enrollment.courseSchedules
        .map((s) => s.classSchedule?.weekday)
        .filter((w): w is Weekday => Boolean(w)),
    ),
  );

  return {
    enrollmentId: enrollment.studentEnrollmentId,
    courseId,
    courseName: schedule?.course?.name ?? courseId,
    branchName: classSchedule?.branch?.name ?? "",
    statusLabel: StudentEnrollmentStatusLabel[enrollment.status],
    scheduleLabel: classSchedule
      ? `${WeekdayLabel[classSchedule.weekday] ?? classSchedule.weekday} · ${classSchedule.startTime}–${classSchedule.endTime}`
      : "Chưa có lịch học",
    packageLabel: "Gói học",
    usedSessions: learningProgress.total - learningProgress.scheduled,
    totalSessions: learningProgress.total,
    coachName: "",
    dateRangeLabel: `${enrollment.startDate} → ${enrollment.endDate}`,
    tuitionFee: 0,
    history: !currentStatuses.has(enrollment.status),
    weekdays,
    courseType: schedule?.course?.name,
  };
}

function toCoachCourseView(
  assignment: CourseStaffAssignmentSimpleResponse,
): CourseFilterItem {
  const schedule = assignment.courseSchedule;
  const classSchedule = schedule.classSchedule;
  const courseId =
    schedule.course?.courseId ?? assignment.courseStaffAssignmentId;

  const weekdays = classSchedule?.weekday ? [classSchedule.weekday] : [];

  return {
    enrollmentId: assignment.courseStaffAssignmentId,
    courseId,
    courseName: schedule.course?.name ?? courseId,
    branchName: classSchedule?.branch?.name ?? "",
    statusLabel: assignment.assignmentStatus,
    scheduleLabel: classSchedule
      ? `${WeekdayLabel[classSchedule.weekday] ?? classSchedule.weekday} · ${classSchedule.startTime}–${classSchedule.endTime}`
      : "Chưa có lịch học",
    packageLabel: "Phân công HLV",
    usedSessions:
      (schedule.learningProgress?.total ?? 0) -
      (schedule.learningProgress?.scheduled ?? 0),
    totalSessions: schedule.learningProgress?.total ?? 0,
    coachName: "",
    dateRangeLabel: `${assignment.startDate} → ${assignment.endDate ?? "nay"}`,
    tuitionFee: 0,
    history: !["ACTIVE", "PENDING"].includes(assignment.assignmentStatus),
    weekdays,
    courseType: schedule.course?.name,
  };
}

export function StudentCoursesScreen({
  studentCode,
  personType = "student",
}: StudentRouteProps) {
  const router = useRouter();
  const [tab, setTab] = useState<StudentCourseTab>("current");
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<CourseFilterState>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<CourseFilterState>(emptyFilters);

  const studentQuery = useStudentEnrollments(
    personType === "student" ? studentCode : undefined,
  );
  const coachQuery = useCoachAssignments(
    personType === "coach" ? studentCode : undefined,
  );
  const query = personType === "coach" ? coachQuery : studentQuery;

  const allEnrollments = useMemo(
    () =>
      personType === "coach"
        ? coachQuery.items.map(toCoachCourseView)
        : studentQuery.items.map(toCourseView),
    [coachQuery.items, personType, studentQuery.items],
  );

  const tabEnrollments = useMemo(
    () =>
      allEnrollments.filter((item) =>
        tab === "history" ? item.history : !item.history,
      ),
    [allEnrollments, tab],
  );

  // Available options derived from data (with defaults for common types if not yet loaded)
  const availableWeekdays = useMemo(() => {
    const presentDays = new Set<Weekday>();
    allEnrollments.forEach((item) => {
      item.weekdays.forEach((w) => presentDays.add(w));
    });
    // If there are existing weekdays in items, show those in standard order; otherwise show all 7 days
    const list = presentDays.size > 0
      ? WEEKDAY_ORDER.filter((d) => presentDays.has(d))
      : WEEKDAY_ORDER;
    return list.map((day) => ({
      value: day,
      label: WeekdayLabel[day] ?? day,
    }));
  }, [allEnrollments]);

  const availableCourseTypes = useMemo(() => {
    const types = new Set<string>();
    allEnrollments.forEach((item) => {
      if (item.courseType) types.add(item.courseType);
    });
    // Fallback to course levels if courses don't have distinct names yet
    if (types.size === 0) {
      (["BASIC", "ADVANCED", "EXPERT"] as CourseLevel[]).forEach((lvl) => {
        types.add(CourseLevelLabel[lvl]);
      });
    }
    return Array.from(types).map((t) => ({
      value: t,
      label: t,
    }));
  }, [allEnrollments]);

  const appliedCount =
    filters.weekdays.length + filters.courseTypes.length;

  const visible = useMemo(() => {
    return tabEnrollments.filter((item) => {
      if (
        filters.weekdays.length > 0 &&
        !item.weekdays.some((w) => filters.weekdays.includes(w))
      ) {
        return false;
      }
      if (
        filters.courseTypes.length > 0 &&
        (!item.courseType || !filters.courseTypes.includes(item.courseType))
      ) {
        return false;
      }
      return true;
    });
  }, [tabEnrollments, filters]);

  const prefetch = useShortListPrefetch({
    identity: `${studentCode}:${tab}`,
    hasNextPage: Boolean(query.hasNextPage),
    isFetchingNextPage: query.isFetchingNextPage,
    loadNextPage: query.loadNextPage,
  });

  const filterGroups: MultiSelectFilterGroup[] = [
    {
      key: "weekdays",
      title: "Thứ trong tuần",
      options: availableWeekdays,
      selectedValues: draftFilters.weekdays,
      onToggle: (val) =>
        setDraftFilters((prev) => ({
          ...prev,
          weekdays: toggleMultiSelectFilterValue(prev.weekdays, val as Weekday),
        })),
      onSelectAll: () =>
        setDraftFilters((prev) => ({
          ...prev,
          weekdays: availableWeekdays.map((o) => o.value),
        })),
      onClear: () =>
        setDraftFilters((prev) => ({
          ...prev,
          weekdays: [],
        })),
    },
    {
      key: "courseTypes",
      title: "Loại lớp / Khóa học",
      options: availableCourseTypes,
      selectedValues: draftFilters.courseTypes,
      onToggle: (val) =>
        setDraftFilters((prev) => ({
          ...prev,
          courseTypes: toggleMultiSelectFilterValue(prev.courseTypes, val as string),
        })),
      onSelectAll: () =>
        setDraftFilters((prev) => ({
          ...prev,
          courseTypes: availableCourseTypes.map((o) => o.value),
        })),
      onClear: () =>
        setDraftFilters((prev) => ({
          ...prev,
          courseTypes: [],
        })),
    },
  ];

  const handleOpenFilter = () => {
    setDraftFilters(filters);
    setFilterVisible(true);
  };

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setFilterVisible(false);
  };

  const handleResetFilters = () => {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
    setFilterVisible(false);
  };

  return (
    <>
      <StackScreenLayout
        title="Khóa học"
        scrollEnabled={false}
        refreshEnabled={false}
        rightActions={
          <>
            <HeaderActionButton
              icon={<Tuning />}
              label="Lọc khóa học"
              badge={appliedCount || undefined}
              color={Colors.light.text}
              onPress={handleOpenFilter}
              testID="student-courses-filter-button"
            />
            <DefaultHeaderActions color={Colors.light.text} />
          </>
        }
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
                {appliedCount > 0
                  ? "Không tìm thấy khóa học phù hợp với bộ lọc."
                  : "Chưa có khóa học."}
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

      <BottomSheetWindow
        visible={filterVisible}
        title="Lọc"
        accessibilityLabel="Lọc khóa học"
        backdropAccessibilityLabel="Đóng bộ lọc"
        onClose={() => setFilterVisible(false)}
        footer={
          <FilterSheetActions
            canApply
            onReset={handleResetFilters}
            onApply={handleApplyFilters}
          />
        }
      >
        <MultiSelectFilterContent groups={filterGroups} />
      </BottomSheetWindow>
    </>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 16, paddingBottom: 32, gap: 20 },
  gap: { height: 12 },
  blackText: { color: Colors.light.text },
  secondaryText: { color: Colors.light.textSecondary },
});
