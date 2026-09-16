import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Tuning } from "reicon-react-native";

import { DefaultHeaderActions } from "@/routes/navigation/components/DefaultHeaderActions";
import { HeaderActionButton } from "@/routes/navigation/components/HeaderActionButton";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors } from "@/theme";

import { HistoryRecordCard } from "../components/HistoryRecordCard";
import { HistorySelectSheet } from "../components/HistorySelectSheet";
import { TrainingScoreFloatingButton } from "../components/TrainingScoreFloatingButton";
import { TrainingScoreSheet } from "../components/TrainingScoreSheet";
import { getMockHistoryRecords } from "../data/history.mock";
import type { AttendanceHistoryMode } from "../domain/historyAccess";
import type { CalendarQuarter } from "../domain/historyDateRange";
import { useAttendanceHistoryQuery } from "../hooks/useAttendanceHistoryQuery";
import {
  HistoryFilterActions,
  HistoryFilterContent,
} from "./AttendanceHistoryScreen/HistoryFilterContent";
import { HistoryPeriodSearchForm } from "./AttendanceHistoryScreen/HistoryPeriodSearchForm";
import {
  emptyHistoryFilters,
  getHistoryFilterDateRange,
  getHistoryFilterGroups,
} from "./AttendanceHistoryScreen/historyFilter.logic";
import type { HistoryFilterState } from "./AttendanceHistoryScreen/historyFilter.types";

type AttendanceHistoryScreenProps = {
  mode: AttendanceHistoryMode;
};

type PickerType = "year" | "quarter" | null;

const SHEET_HANDOFF_DELAY_MS = 140;

export default function AttendanceHistoryScreen({
  mode,
}: AttendanceHistoryScreenProps) {
  const [selectedYear, setSelectedYear] = useState<number>();
  const [selectedQuarter, setSelectedQuarter] = useState<CalendarQuarter>();
  const [picker, setPicker] = useState<PickerType>(null);
  const [quarterError, setQuarterError] = useState<string | null>(null);
  const [filters, setFilters] =
    useState<HistoryFilterState>(emptyHistoryFilters);
  const [draftFilters, setDraftFilters] =
    useState<HistoryFilterState>(emptyHistoryFilters);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(false);
  const handoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const records = useMemo(() => getMockHistoryRecords(mode), [mode]);
  const filterGroups = useMemo(
    () => getHistoryFilterGroups(records),
    [records],
  );
  const appliedCount = filters.branchIds.length + filters.shifts.length;
  const canSearch = Boolean(selectedYear && selectedQuarter);
  const searchEnabled = canSearch && !hasSearched;

  const {
    records: visibleRecords,
    isLoading,
    isError,
    refetch,
  } = useAttendanceHistoryQuery({
    mode,
    filters,
    enabled: hasSearched,
  });
  const selectedRange = hasSearched ? getHistoryFilterDateRange(filters) : null;
  const title = mode === "student" ? "Điểm danh" : "Chấm công";
  const filterLabel =
    mode === "student" ? "Lọc lịch sử điểm danh" : "Lọc lịch sử chấm công";

  useEffect(
    () => () => {
      if (handoffTimerRef.current) {
        clearTimeout(handoffTimerRef.current);
      }
    },
    [],
  );

  const closePicker = () => {
    if (handoffTimerRef.current) {
      clearTimeout(handoffTimerRef.current);
    }
    setPicker(null);
  };

  const openQuarterPickerAfterHandoff = () => {
    if (handoffTimerRef.current) {
      clearTimeout(handoffTimerRef.current);
    }

    setPicker(null);
    handoffTimerRef.current = setTimeout(() => {
      setPicker("quarter");
    }, SHEET_HANDOFF_DELAY_MS);
  };

  const handleYearPress = () => {
    setQuarterError(null);
    setPicker("year");
  };

  const handleQuarterPress = () => {
    if (!selectedYear) {
      setQuarterError("Vui lòng chọn năm học trước");
      return;
    }

    setQuarterError(null);
    setPicker("quarter");
  };

  const openFilter = () => {
    setDraftFilters(filters);
    setFilterError(null);
    setFilterVisible(true);
  };

  const handleResetFilters = () => {
    setDraftFilters({
      ...emptyHistoryFilters,
      year: selectedYear,
      quarter: selectedQuarter,
    });
    setFilterError(null);
  };

  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setHasSearched(true);
    setFilterError(null);
    setFilterVisible(false);
  };

  const handleSearch = () => {
    if (!selectedYear || !selectedQuarter) return;

    const nextFilters = {
      ...emptyHistoryFilters,
      year: selectedYear,
      quarter: selectedQuarter,
    };

    setFilters(nextFilters);
    setDraftFilters(nextFilters);
    setHasSearched(true);
    setFilterError(null);
  };

  return (
    <>
      <StackScreenLayout
        title={title}
        rightActions={
          <>
            {hasSearched ? (
              <HeaderActionButton
                icon={<Tuning />}
                label={filterLabel}
                badge={appliedCount || undefined}
                onPress={openFilter}
                testID="attendance-history-filter-button"
              />
            ) : null}
            <DefaultHeaderActions />
          </>
        }
        contentContainerStyle={styles.content}
        floatingContent={
          hasSearched && mode === "student" ? (
            <TrainingScoreFloatingButton
              onPress={() => setScoreVisible(true)}
            />
          ) : undefined
        }
      >
        <HistoryPeriodSearchForm
          selectedYear={selectedYear}
          selectedQuarter={selectedQuarter}
          quarterError={quarterError}
          searchEnabled={searchEnabled}
          selectedRange={selectedRange}
          onYearPress={handleYearPress}
          onQuarterPress={handleQuarterPress}
          onSearch={handleSearch}
        />

        {hasSearched ? (
          isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
              <ThemedText type="bodySmall" style={styles.loadingText}>
                Đang tải dữ liệu...
              </ThemedText>
            </View>
          ) : isError ? (
            <View style={styles.centerContainer}>
              <ThemedText type="body" style={styles.emptyTitle}>
                Không thể tải dữ liệu lịch sử
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.emptyDescription}>
                Đã xảy ra lỗi trong quá trình tải. Vui lòng thử lại.
              </ThemedText>
              <Pressable style={styles.retryButton} onPress={() => refetch()}>
                <ThemedText type="bodySmall" style={styles.retryText}>
                  Thử lại
                </ThemedText>
              </Pressable>
            </View>
          ) : visibleRecords.length ? (
            <View style={styles.list}>
              {visibleRecords.map((record) => (
                <HistoryRecordCard key={record.id} record={record} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <ThemedText type="body" style={styles.emptyTitle}>
                Không có lịch sử phù hợp
              </ThemedText>
              <ThemedText type="bodySmall" style={styles.emptyDescription}>
                Thử đổi cơ sở, ca hoặc kỳ lọc để xem thêm kết quả.
              </ThemedText>
            </View>
          )
        ) : null}
      </StackScreenLayout>

      <HistorySelectSheet
        visible={picker === "year"}
        title="Chọn năm học"
        options={filterGroups.years.options}
        selectedValue={selectedYear}
        onClose={closePicker}
        onPreviewSelect={(year) => {
          setSelectedYear(year);
          setSelectedQuarter(undefined);
          setQuarterError(null);
          setHasSearched(false);
          setFilters(emptyHistoryFilters);
          setDraftFilters(emptyHistoryFilters);
        }}
        onSelect={openQuarterPickerAfterHandoff}
      />

      <HistorySelectSheet
        visible={picker === "quarter"}
        title="Chọn quý"
        options={filterGroups.quarters.options}
        selectedValue={selectedQuarter}
        onClose={closePicker}
        onPreviewSelect={(quarter) => {
          setSelectedQuarter(quarter);
          setQuarterError(null);
          setHasSearched(false);
          setFilters(emptyHistoryFilters);
          setDraftFilters(emptyHistoryFilters);
        }}
        onSelect={() => {
          setPicker(null);
        }}
      />

      <BottomSheetWindow
        visible={filterVisible}
        title="Lọc"
        accessibilityLabel={filterLabel}
        backdropAccessibilityLabel="Đóng lọc lịch sử"
        onClose={() => setFilterVisible(false)}
        footer={
          <HistoryFilterActions
            canApply
            onReset={handleResetFilters}
            onApply={handleApplyFilters}
          />
        }
      >
        <HistoryFilterContent
          value={draftFilters}
          multiGroups={filterGroups.multi}
          error={filterError}
          onChange={(next) => {
            setDraftFilters(next);
            setFilterError(null);
          }}
        />
      </BottomSheetWindow>

      <TrainingScoreSheet
        visible={scoreVisible}
        onClose={() => setScoreVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  list: {
    gap: 20,
    marginTop: 21,
    paddingBottom: 36,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 82,
    paddingHorizontal: 18,
  },
  emptyTitle: {
    color: Colors.light.text,
    textAlign: "center",
  },
  emptyDescription: {
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  centerContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 82,
    paddingHorizontal: 18,
  },
  loadingText: {
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
