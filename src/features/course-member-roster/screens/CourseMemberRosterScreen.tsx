import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { Plus } from "reicon-react-native";
import { useRouter } from "expo-router";

import { Permission, useCan } from "@/features/authorization";
import type { CourseScheduleResponse } from "@/features/course/api/course.dto";
import { useCourseDetail } from "@/features/course/queries/courseCatalogQueries";
import type { AssignmentType } from "@/features/course-staff-assignment/constants/course-staff-assignment.constants";
import { AssignmentTypeLabel } from "@/features/course-staff-assignment/constants/course-staff-assignment.constants";
import type { PersonSimpleResponse } from "@/features/person";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AppIcon } from "@/shared/ui/AppIcon";
import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import {
  FormField,
  PrimaryActionButton,
  SurfaceCard,
} from "@/shared/ui/commerce/CommercePrimitives";
import { ThemedText } from "@/shared/ui/ThemedText";
import { useToast } from "@/shared/ui/Toast";
import {
  AdminIntro,
  AdminSearchField,
  AdminSectionHeader,
} from "@/shared/ui/admin/AdministrationPrimitives";
import { Colors, effects, radii, Spacing } from "@/theme";

import {
  courseMemberConfig,
  formatScheduleLabel,
  type CourseMemberKind,
  type RosterMember,
} from "../domain/courseMemberRoster";
import {
  getLocalDate,
  useCourseMemberRoster,
  useCreateCourseStaffAssignment,
  useStaffCandidates,
} from "../queries/courseMemberRosterQueries";

type Props = { courseId: string; memberKind: CourseMemberKind };

const rosterIntro: Record<CourseMemberKind, string> = {
  coaches: "Theo dõi huấn luyện viên và lịch được phân công trong khóa học.",
  "teaching-assistants": "Theo dõi trợ giảng và lịch được phân công trong khóa học.",
  students: "Theo dõi học viên và các lịch đang theo học trong khóa học.",
};

function MemberCard({ member }: { member: RosterMember }) {
  return (
    <SurfaceCard soft>
      <View style={styles.memberHeader} accessibilityLabel={member.person.fullName}>
        <View style={styles.avatar}>
          <ThemedText type="subtitle" style={styles.avatarText}>
            {member.person.fullName.trim().charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.flex}>
          <ThemedText type="bodySmall" style={styles.strongText}>
            {member.person.fullName}
          </ThemedText>
          {member.person.personCode ? (
            <ThemedText type="caption" style={styles.secondaryText}>
              {member.person.personCode}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <View style={styles.assignmentList}>
        {member.assignments.map((assignment) => (
          <View key={assignment.id} style={styles.assignmentRow}>
            <View style={styles.flex}>
              <ThemedText type="caption" style={styles.strongText}>
                {assignment.scheduleLabel}
              </ThemedText>
              <ThemedText type="caption" style={styles.secondaryText}>
                {assignment.startDate} → {assignment.endDate ?? "Không thời hạn"}
              </ThemedText>
            </View>
            {assignment.roleLabel ? (
              <View style={assignment.role === "PRIMARY_COACH" ? styles.primaryBadge : styles.roleBadge}>
                <ThemedText type="caption" style={assignment.role === "PRIMARY_COACH" ? styles.primaryBadgeText : styles.roleBadgeText}>
                  {assignment.roleLabel}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}

function StaffAssignmentSheet({
  visible,
  courseId,
  memberKind,
  schedules,
  onClose,
}: {
  visible: boolean;
  courseId: string;
  memberKind: Exclude<CourseMemberKind, "students">;
  schedules: CourseScheduleResponse[];
  onClose: () => void;
}) {
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [search, setSearch] = useState("");
  const [selectedPerson, setSelectedPerson] = useState<PersonSimpleResponse | null>(null);
  const [scheduleId, setScheduleId] = useState("");
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(
    memberKind === "coaches" ? "ASSISTANT_COACH" : "TEACHING_ASSISTANT",
  );
  const [startDate, setStartDate] = useState(getLocalDate());
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const candidates = useStaffCandidates(search, visible && step === 1);
  const mutation = useCreateCourseStaffAssignment(courseId);

  const closeAndReset = () => {
    setStep(1);
    setSearch("");
    setSelectedPerson(null);
    setScheduleId("");
    setAssignmentType(memberKind === "coaches" ? "ASSISTANT_COACH" : "TEACHING_ASSISTANT");
    setStartDate(getLocalDate());
    setEndDate("");
    setNote("");
    onClose();
  };

  const submit = async () => {
    if (!selectedPerson || !scheduleId) return;
    if (endDate && endDate < startDate) {
      toast.show({ message: "Ngày kết thúc phải từ ngày bắt đầu trở đi.", variant: "error" });
      return;
    }
    try {
      await mutation.mutateAsync({
        staffPersonId: selectedPerson.personId,
        courseScheduleId: scheduleId,
        assignmentType,
        startDate,
        endDate: endDate || null,
        assignmentStatus: "ACTIVE",
        note: note || null,
      });
      toast.show({ message: "Đã thêm phân công.", variant: "success" });
      closeAndReset();
    } catch {
      toast.show({ message: "Không thể thêm phân công. Vui lòng kiểm tra thời gian và thử lại.", variant: "error" });
    }
  };

  return (
    <BottomSheetWindow
      visible={visible}
      title={step === 1 ? "Chọn nhân sự" : "Thông tin phân công"}
      heightRatio={0.8}
      onClose={closeAndReset}
      footer={step === 2 ? (
        <View style={styles.footerRow}>
          <View style={styles.footerAction}><PrimaryActionButton title="Quay lại" variant="outline" onPress={() => setStep(1)} /></View>
          <View style={styles.footerAction}><PrimaryActionButton title="Thêm" loading={mutation.isPending} disabled={!scheduleId || !selectedPerson} onPress={() => void submit()} /></View>
        </View>
      ) : undefined}
    >
      {step === 1 ? (
        <View style={styles.sheetContent}>
          <ThemedText type="caption" style={styles.stepLabel}>BƯỚC 1/2 · NHÂN SỰ</ThemedText>
          <FormField label="Tìm nhân sự" placeholder="Tên hoặc mã nhân sự" value={search} onChangeText={setSearch} />
          {candidates.isLoading ? <ActivityIndicator color={Colors.light.primary} /> : null}
          {candidates.isError ? (
            <View style={styles.inlineState}>
              <ThemedText type="bodySmall" style={styles.emptyText}>Không thể tải danh sách nhân sự.</ThemedText>
              <PrimaryActionButton title="Thử lại" variant="outline" onPress={() => void candidates.refetch()} />
            </View>
          ) : null}
          {candidates.data?.content.length ? (
            <View style={styles.choiceGroup}>
              {candidates.data.content.map((person, index) => (
                <Pressable
                  key={person.personId}
                  accessibilityRole="button"
                  accessibilityLabel={`Chọn ${person.fullName}`}
                  onPress={() => { setSelectedPerson(person); setStep(2); }}
                  style={({ pressed }) => [
                    styles.choiceRow,
                    index < candidates.data.content.length - 1 ? styles.choiceDivider : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <View style={styles.choiceAvatar}>
                    <ThemedText type="bodySmall" style={styles.avatarText}>{person.fullName.trim().charAt(0).toUpperCase()}</ThemedText>
                  </View>
                  <View style={styles.flex}>
                    <ThemedText type="bodySmall" style={styles.strongText}>{person.fullName}</ThemedText>
                    <ThemedText type="caption" style={styles.secondaryText}>{person.personCode ?? "Chưa có mã"}</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}
          {!candidates.isLoading && !candidates.data?.content.length ? (
            <ThemedText type="bodySmall" style={styles.emptyText}>Không tìm thấy nhân sự ACTIVE.</ThemedText>
          ) : null}
        </View>
      ) : (
        <View style={styles.sheetContent}>
          <ThemedText type="caption" style={styles.stepLabel}>BƯỚC 2/2 · PHÂN CÔNG</ThemedText>
          <View style={styles.selectedPersonSummary}>
            <ThemedText type="caption" style={styles.secondaryText}>Nhân sự đã chọn</ThemedText>
            <ThemedText type="bodySmall" style={styles.strongText}>{selectedPerson?.fullName}</ThemedText>
          </View>
          <ThemedText type="bodySmall" style={styles.fieldLabel}>Lịch học</ThemedText>
          {schedules.map((schedule) => (
            <Pressable
              key={schedule.courseScheduleId}
              accessibilityRole="radio"
              accessibilityState={{ selected: scheduleId === schedule.courseScheduleId }}
              onPress={() => {
                setScheduleId(schedule.courseScheduleId);
                setStartDate((current) => current < schedule.startDate ? schedule.startDate : current);
                if (schedule.endDate) setEndDate(schedule.endDate);
              }}
              style={[styles.option, scheduleId === schedule.courseScheduleId ? styles.optionSelected : null]}
            >
              <ThemedText type="caption" style={styles.strongText}>{formatScheduleLabel(schedule)}</ThemedText>
            </Pressable>
          ))}
          {memberKind === "coaches" ? (
            <>
              <ThemedText type="bodySmall" style={styles.fieldLabel}>Vai trò</ThemedText>
              <View style={styles.roleOptions}>
                {(["PRIMARY_COACH", "ASSISTANT_COACH"] as AssignmentType[]).map((role) => (
                  <Pressable accessibilityRole="radio" accessibilityState={{ selected: assignmentType === role }} key={role} onPress={() => setAssignmentType(role)} style={[styles.option, styles.flex, assignmentType === role ? styles.optionSelected : null]}>
                    <ThemedText type="caption" style={styles.strongText}>{AssignmentTypeLabel[role]}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          <FormField label="Ngày bắt đầu" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} autoCapitalize="none" />
          <FormField label="Ngày kết thúc (không bắt buộc)" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} autoCapitalize="none" />
          <FormField label="Ghi chú (không bắt buộc)" value={note} onChangeText={setNote} multiline />
        </View>
      )}
    </BottomSheetWindow>
  );
}

export function CourseMemberRosterScreen({ courseId, memberKind }: Props) {
  const router = useRouter();
  const config = courseMemberConfig[memberKind];
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sheetVisible, setSheetVisible] = useState(false);
  const canAddStaff = useCan(Permission.COURSE_STAFF_ASSIGNMENT_CREATE);
  const canAddStudent = useCan(Permission.COURSE_PURCHASE_CREATE);
  const canAdd = memberKind === "students" ? canAddStudent : canAddStaff;
  const roster = useCourseMemberRoster(courseId, memberKind, search);
  const course = useCourseDetail(courseId);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const schedules = useMemo(() => course.data?.courseSchedules ?? [], [course.data]);
  const openAdd = () => {
    if (memberKind === "students") {
      router.push(`/courses/${courseId}/register`);
      return;
    }
    setSheetVisible(true);
  };

  const isInitialLoading = roster.isLoading || roster.isPending;
  const isFiltered = search.length > 0;

  return (
    <StackScreenLayout title={config.title} scrollEnabled={false} refreshEnabled={false}>
      <FlatList
        data={roster.members}
        keyExtractor={(item) => item.person.personId}
        renderItem={({ item }) => <MemberCard member={item} />}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={roster.isRefetching && !roster.isFetchingNextPage}
            onRefresh={() => void roster.refetch()}
            tintColor={Colors.light.primary}
            colors={[Colors.light.primary]}
          />
        }
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ListSeparator}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <AdminIntro>{rosterIntro[memberKind]}</AdminIntro>
            <View style={styles.searchRow}>
              <View style={styles.searchField}>
                <AdminSearchField
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder={`Tìm ${config.title.toLowerCase()}`}
                />
              </View>
              {canAdd ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Thêm ${config.title.toLowerCase()}`}
                  onPress={openAdd}
                  style={({ pressed }) => [
                    styles.addButton,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <AppIcon icon={<Plus />} size={24} color={Colors.light.surface} />
                </Pressable>
              ) : null}
            </View>
            <AdminSectionHeader title={`Danh sách ${config.title.toLowerCase()}`} />
          </View>
        }
        ListEmptyComponent={
          isInitialLoading ? (
            <View style={styles.state}>
              <ActivityIndicator
                accessibilityLabel="Đang tải danh sách"
                color={Colors.light.primary}
              />
            </View>
          ) : roster.isError ? (
            <View style={styles.state}>
              <ThemedText type="bodySmall" style={styles.emptyText}>
                Không thể tải danh sách.
              </ThemedText>
              <PrimaryActionButton
                title="Thử lại"
                variant="outline"
                onPress={() => void roster.refetch()}
              />
            </View>
          ) : (
            <View style={styles.state}>
              <ThemedText type="bodySmall" style={styles.emptyText}>
                {isFiltered ? "Không tìm thấy kết quả phù hợp." : config.emptyText}
              </ThemedText>
            </View>
          )
        }
        onEndReached={() => {
          if (roster.hasNextPage && !roster.isFetchingNextPage) {
            void roster.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          roster.isFetchingNextPage ? (
            <View accessibilityLabel="Đang tải thêm danh sách" style={styles.footer}>
              <ActivityIndicator color={Colors.light.primary} />
            </View>
          ) : null
        }
      />
      {memberKind !== "students" ? (
        <StaffAssignmentSheet
          visible={sheetVisible}
          courseId={courseId}
          memberKind={memberKind}
          schedules={schedules}
          onClose={() => setSheetVisible(false)}
        />
      ) : null}
    </StackScreenLayout>
  );
}

function ListSeparator() {
  return <View style={styles.listGap} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  searchRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  searchField: { flex: 1, minWidth: 0 },
  addButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: Colors.light.primary, borderCurve: "continuous" },
  pressed: effects.pressed,
  listContent: { flexGrow: 1, paddingTop: 20, paddingBottom: 32 },
  listHeader: { gap: 14, marginBottom: 14 },
  listGap: { height: 12 },
  state: { alignItems: "center", gap: 12, paddingHorizontal: Spacing.three, paddingVertical: Spacing.four },
  footer: { alignItems: "center", paddingTop: 16 },
  emptyText: { color: Colors.light.textSecondary, textAlign: "center" },
  memberHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.pill, backgroundColor: Colors.light.primarySoft },
  avatarText: { color: Colors.light.primary },
  strongText: { color: Colors.light.text, fontWeight: "600" },
  secondaryText: { color: Colors.light.textSecondary },
  assignmentList: { gap: 8, paddingTop: 4 },
  assignmentRow: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.light.divider },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: Colors.light.backgroundElement },
  roleBadgeText: { color: Colors.light.textSecondary },
  primaryBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: Colors.light.primarySoft },
  primaryBadgeText: { color: Colors.light.primary, fontWeight: "700" },
  sheetContent: { gap: 12 },
  stepLabel: { color: Colors.light.primary },
  inlineState: { alignItems: "center", gap: Spacing.two, paddingVertical: Spacing.three },
  choiceGroup: { overflow: "hidden", borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.md, backgroundColor: Colors.light.surface, borderCurve: "continuous" },
  choiceRow: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 8 },
  choiceDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.divider },
  choiceAvatar: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radii.pill, backgroundColor: Colors.light.primarySoft },
  selectedPersonSummary: { gap: Spacing.one, padding: 12, borderRadius: radii.md, backgroundColor: Colors.light.backgroundElement, borderCurve: "continuous" },
  fieldLabel: { color: Colors.light.text, fontWeight: "600", marginTop: 4 },
  option: { minHeight: 48, justifyContent: "center", padding: 12, borderWidth: 1, borderColor: Colors.light.divider, borderRadius: radii.md, backgroundColor: Colors.light.surface, borderCurve: "continuous" },
  optionSelected: { borderColor: Colors.light.primary, backgroundColor: Colors.light.primarySoft },
  roleOptions: { flexDirection: "row", gap: 8 },
  footerRow: { flexDirection: "row", gap: Spacing.two },
  footerAction: { flex: 1 },
});
