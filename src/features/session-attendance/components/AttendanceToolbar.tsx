import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { ArrowSwapHorizontal } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, radii } from "@/theme";

import type {
  AttendanceFilter,
  BeltFilter,
  BeltSort,
} from "../domain/sessionAttendancePresentation";
import {
  formatBeltName,
  UNKNOWN_BELT_FILTER,
} from "../domain/sessionAttendancePresentation";

const ATTENDANCE_FILTERS: {
  value: AttendanceFilter;
  label: string;
}[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "UNMARKED", label: "Chưa điểm danh" },
  { value: "PRESENT", label: "Có mặt" },
  { value: "LATE", label: "Đi muộn" },
  { value: "MAKEUP", label: "Học bù" },
  { value: "EXCUSED", label: "Có phép" },
  { value: "ABSENT", label: "Vắng" },
];

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.selectedChip : null,
        activeEffect(pressed, "pressedScale"),
      ]}
    >
      <ThemedText
        type="bodySmall"
        style={[styles.chipText, selected ? styles.selectedChipText : null]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function AttendanceToolbar({
  attendanceFilter,
  beltFilter,
  availableBelts,
  hasUnknownBelt,
  beltSort,
  onAttendanceFilterChange,
  onBeltFilterChange,
  onBeltSortChange,
}: {
  attendanceFilter: AttendanceFilter;
  beltFilter: BeltFilter;
  availableBelts: string[];
  hasUnknownBelt: boolean;
  beltSort: BeltSort;
  onAttendanceFilterChange: (value: AttendanceFilter) => void;
  onBeltFilterChange: (value: BeltFilter) => void;
  onBeltSortChange: () => void;
}) {
  return (
    <View style={styles.container}>
      <ThemedText type="bodySmall" style={styles.label}>
        Trạng thái điểm danh
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {ATTENDANCE_FILTERS.map((filter) => (
          <FilterChip
            key={filter.value}
            label={filter.label}
            selected={attendanceFilter === filter.value}
            onPress={() => onAttendanceFilterChange(filter.value)}
          />
        ))}
      </ScrollView>

      <View style={styles.beltHeader}>
        <ThemedText type="bodySmall" style={styles.label}>
          Cấp đai
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            beltSort === "ASC"
              ? "Đang xếp đai từ thấp đến cao"
              : "Đang xếp đai từ cao đến thấp"
          }
          onPress={onBeltSortChange}
          style={({ pressed }) => [
            styles.sortButton,
            activeEffect(pressed, "pressedScale"),
          ]}
        >
          <AppIcon
            icon={<ArrowSwapHorizontal />}
            size={16}
            color={Colors.light.primary}
          />
          <ThemedText type="caption" style={styles.sortText}>
            {beltSort === "ASC" ? "Thấp → cao" : "Cao → thấp"}
          </ThemedText>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        <FilterChip
          label="Tất cả"
          selected={beltFilter === "ALL"}
          onPress={() => onBeltFilterChange("ALL")}
        />
        {availableBelts.map((belt) => (
          <FilterChip
            key={belt}
            label={formatBeltName(belt)}
            selected={beltFilter === belt}
            onPress={() => onBeltFilterChange(belt)}
          />
        ))}
        {hasUnknownBelt ? (
          <FilterChip
            label="Chưa rõ đai"
            selected={beltFilter === UNKNOWN_BELT_FILTER}
            onPress={() => onBeltFilterChange(UNKNOWN_BELT_FILTER)}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { color: Colors.light.text, fontWeight: "600" },
  chipRow: { gap: 8, paddingRight: 20 },
  chip: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.surface,
  },
  selectedChip: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  chipText: { color: Colors.light.textSecondary },
  selectedChipText: { color: Colors.light.primary, fontWeight: "700" },
  beltHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sortButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: radii.md,
  },
  sortText: { color: Colors.light.primary, fontWeight: "700" },
});
