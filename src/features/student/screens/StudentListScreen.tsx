import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Filter, InfoCircle, Search, X } from "reicon-react-native";

import type { Belt, PersonStatus } from "@/features/person/constants/person.constants";
import { BeltLabel } from "@/features/person/constants/person.constants";
import { useStudents } from "@/features/person/queries/personQueries";
import { StudentListItem } from "@/features/student/components/StudentListItem";
import { StudentStatsCard } from "@/features/student/components/StudentStatsCard";
import {
  STUDENT_TABS,
  type StudentListTab,
} from "@/features/student/utils/studentListViewModel";
import { DefaultHeaderActions } from "@/routes/navigation/components/DefaultHeaderActions";
import { HeaderActionButton } from "@/routes/navigation/components/HeaderActionButton";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { AdminButton, AdminCard, AdminChip, AdminField } from "@/shared/ui/admin/AdministrationPrimitives";
import { AppIcon } from "@/shared/ui/AppIcon";
import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, radii } from "@/theme";

export interface StudentFilterState {
  search?: string;
  status?: PersonStatus;
  currentBelt?: Belt;
  gender?: boolean;
}

const BELT_OPTIONS: Belt[] = [
  "C10",
  "C9",
  "C8",
  "C7",
  "C6",
  "C5",
  "C4",
  "C3",
  "C2",
  "C1",
  "D1",
  "D2",
  "D3",
];

export function StudentListScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<StudentListTab>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Active filters applied to query
  const [appliedFilters, setAppliedFilters] = useState<StudentFilterState>({});
  // Draft filters inside sheet
  const [draftFilters, setDraftFilters] = useState<StudentFilterState>({});

  // Sync tab with status query if not overridden by explicit filter
  const queryStatus: PersonStatus | undefined = useMemo(() => {
    if (appliedFilters.status) return appliedFilters.status;
    if (activeTab === "learning") return "ACTIVE";
    if (activeTab === "paused") return "INACTIVE";
    return undefined;
  }, [activeTab, appliedFilters.status]);

  const studentsQuery = useStudents({
    search: appliedFilters.search || undefined,
    status: queryStatus,
    currentBelt: appliedFilters.currentBelt,
    gender: appliedFilters.gender,
  });

  const students = studentsQuery.data?.content ?? [];
  const totalElements = studentsQuery.data?.totalElements ?? students.length;

  const activeCount = useMemo(() => {
    return students.filter((s) => s.status === "ACTIVE").length;
  }, [students]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.status) count++;
    if (appliedFilters.currentBelt) count++;
    if (appliedFilters.gender !== undefined) count++;
    return count;
  }, [appliedFilters]);

  const handleOpenFilterSheet = () => {
    setDraftFilters(appliedFilters);
    setFilterSheetOpen(true);
  };

  const handleApplyFilter = () => {
    setAppliedFilters(draftFilters);
    setFilterSheetOpen(false);
  };

  const handleResetFilter = () => {
    setDraftFilters({});
    setAppliedFilters({});
    setFilterSheetOpen(false);
  };

  const handleTabChange = (tab: StudentListTab) => {
    setActiveTab(tab);
    // Clear explicit status filter so tab controls it naturally
    if (appliedFilters.status) {
      setAppliedFilters((prev) => ({ ...prev, status: undefined }));
    }
  };

  return (
    <>
      <StackScreenLayout
        title="Học viên"
        contentContainerStyle={styles.content}
        refreshing={studentsQuery.isRefetching}
        onRefresh={async () => {
          await studentsQuery.refetch();
        }}
        rightActions={
          <>
            <HeaderActionButton
              icon={<Filter />}
              label="Bộ lọc"
              badge={activeFilterCount > 0 ? activeFilterCount : undefined}
              badgeVariant="count"
              onPress={handleOpenFilterSheet}
            />
            <DefaultHeaderActions />
          </>
        }
      >
        <StudentStatsCard
          totalCount={totalElements}
          activeCount={activeCount}
        />

        <SegmentedControl
          options={STUDENT_TABS}
          value={activeTab}
          onChange={handleTabChange}
          style={styles.tabs}
        />

        {/* Active filter summary pill */}
        {activeFilterCount > 0 ? (
          <View style={styles.activeFilterBar}>
            <ThemedText type="caption" style={styles.filterSummaryText}>
              Đang lọc theo {activeFilterCount} tiêu chí
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xóa bộ lọc"
              onPress={() => setAppliedFilters({})}
              style={styles.clearFilterButton}
            >
              <ThemedText type="caption" style={styles.clearFilterText}>
                Xóa lọc
              </ThemedText>
              <AppIcon icon={<X />} size={14} color={Colors.light.primary} />
            </Pressable>
          </View>
        ) : null}

        {studentsQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        ) : (
          <View style={styles.studentList}>
            {students.map((student) => (
              <StudentListItem
                key={student.personId}
                student={student}
                onPress={() =>
                  router.push(
                    `/students/${student.personCode || student.personId}`,
                  )
                }
              />
            ))}
          </View>
        )}

        {!studentsQuery.isLoading && students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ThemedText type="bodySmall" style={styles.helperText}>
              {activeFilterCount > 0
                ? "Không tìm thấy học viên phù hợp với bộ lọc."
                : "Chưa có học viên trong danh sách này."}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.footerNote}>
          <AppIcon
            icon={<InfoCircle />}
            size={22}
            color={Colors.light.textSecondary}
          />
          <ThemedText type="bodySmall" style={styles.helperText}>
            Chọn học viên để xem hồ sơ, ví và khóa học.
          </ThemedText>
        </View>
      </StackScreenLayout>

      {/* Filter Bottom Sheet */}
      <BottomSheetWindow
        visible={filterSheetOpen}
        title="Bộ lọc học viên"
        heightRatio={0.72}
        onClose={() => setFilterSheetOpen(false)}
        footer={
          <View style={styles.filterFooter}>
            <AdminButton
              label="Đặt lại"
              variant="secondary"
              onPress={handleResetFilter}
              style={styles.filterFooterButton}
            />
            <AdminButton
              label="Áp dụng"
              onPress={handleApplyFilter}
              style={styles.filterFooterButton}
            />
          </View>
        }
      >
        <ScrollView
          style={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.filterSection}>
            <ThemedText type="featureLabel">Tìm kiếm</ThemedText>
            <AdminField
              label="Họ tên hoặc mã học viên"
              placeholder="Nhập tên hoặc mã..."
              value={draftFilters.search ?? ""}
              onChangeText={(text) =>
                setDraftFilters((prev) => ({ ...prev, search: text }))
              }
            />
          </View>

          <View style={styles.filterSection}>
            <ThemedText type="featureLabel">Trạng thái</ThemedText>
            <View style={styles.chipRow}>
              <AdminChip
                label="Tất cả"
                selected={draftFilters.status === undefined}
                onPress={() =>
                  setDraftFilters((prev) => ({ ...prev, status: undefined }))
                }
              />
              <AdminChip
                label="Đang học"
                selected={draftFilters.status === "ACTIVE"}
                tone={draftFilters.status === "ACTIVE" ? "success" : "neutral"}
                onPress={() =>
                  setDraftFilters((prev) => ({ ...prev, status: "ACTIVE" }))
                }
              />
              <AdminChip
                label="Bảo lưu"
                selected={draftFilters.status === "INACTIVE"}
                tone={draftFilters.status === "INACTIVE" ? "warning" : "neutral"}
                onPress={() =>
                  setDraftFilters((prev) => ({ ...prev, status: "INACTIVE" }))
                }
              />
              <AdminChip
                label="Tạm ngưng"
                selected={draftFilters.status === "SUSPENDED"}
                tone={draftFilters.status === "SUSPENDED" ? "danger" : "neutral"}
                onPress={() =>
                  setDraftFilters((prev) => ({ ...prev, status: "SUSPENDED" }))
                }
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <ThemedText type="featureLabel">Giới tính</ThemedText>
            <View style={styles.chipRow}>
              <AdminChip
                label="Tất cả"
                selected={draftFilters.gender === undefined}
                onPress={() =>
                  setDraftFilters((prev) => ({ ...prev, gender: undefined }))
                }
              />
              <AdminChip
                label="Nam"
                selected={draftFilters.gender === true}
                tone={draftFilters.gender === true ? "info" : "neutral"}
                onPress={() =>
                  setDraftFilters((prev) => ({ ...prev, gender: true }))
                }
              />
              <AdminChip
                label="Nữ"
                selected={draftFilters.gender === false}
                tone={draftFilters.gender === false ? "info" : "neutral"}
                onPress={() =>
                  setDraftFilters((prev) => ({ ...prev, gender: false }))
                }
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <ThemedText type="featureLabel">Cấp đai</ThemedText>
            <View style={styles.chipWrap}>
              <AdminChip
                label="Tất cả đai"
                selected={draftFilters.currentBelt === undefined}
                onPress={() =>
                  setDraftFilters((prev) => ({ ...prev, currentBelt: undefined }))
                }
              />
              {BELT_OPTIONS.map((belt) => (
                <AdminChip
                  key={belt}
                  label={BeltLabel[belt] || belt}
                  selected={draftFilters.currentBelt === belt}
                  tone={draftFilters.currentBelt === belt ? "info" : "neutral"}
                  onPress={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      currentBelt:
                        prev.currentBelt === belt ? undefined : belt,
                    }))
                  }
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </BottomSheetWindow>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  tabs: {},
  activeFilterBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.md,
  },
  filterSummaryText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  clearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearFilterText: {
    color: Colors.light.primary,
    fontWeight: "600",
  },
  studentList: {
    gap: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  helperText: {
    flex: 1,
    color: Colors.light.textSecondary,
  },
  sheetContent: {
    gap: 16,
    paddingVertical: 4,
  },
  filterSection: {
    gap: 8,
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterFooter: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  filterFooterButton: {
    flex: 1,
  },
});
