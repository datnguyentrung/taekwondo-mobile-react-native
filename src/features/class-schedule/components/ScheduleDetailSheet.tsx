import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, hexToRgba, radii, Spacing } from "@/theme";

export type ScheduleDetailStaff = {
  id: string;
  fullName: string;
  roleLabel: string;
  isPrimary?: boolean;
};

export type ScheduleDetailData = {
  id: string;
  weekdayLabel: string;
  timeLabel: string;
  branchName: string;
  startDate?: string;
  endDate?: string | null;
  statusLabel?: string;
  primaryCoachName?: string;
  staff?: ScheduleDetailStaff[];
};

function formatDate(date?: string | null) {
  if (!date) return "Không giới hạn";
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

export function ScheduleDetailSheet({
  visible,
  schedule,
  onClose,
}: {
  visible: boolean;
  schedule?: ScheduleDetailData;
  onClose: () => void;
}) {
  const staff = schedule?.staff ?? [];
  const primary = staff.find((item) => item.isPrimary);
  const remaining = staff.filter((item) => !item.isPrimary);
  const primaryName = primary?.fullName ?? schedule?.primaryCoachName;
  const isActive = schedule?.statusLabel?.toLowerCase().includes("đang") ?? false;

  return (
    <BottomSheetWindow
      visible={visible}
      title="Chi tiết lịch"
      accessibilityLabel="Cửa sổ chi tiết lịch"
      heightRatio={0.68}
      onClose={onClose}
    >
      {schedule ? (
        <View style={styles.content}>
          <DetailRow label="Loại sự kiện">
            <View style={styles.eventType}>
              <View style={styles.eventDot} />
              <ThemedText type="bodySmall" style={styles.eventText}>Lịch học</ThemedText>
            </View>
          </DetailRow>
          <DetailRow label="Thứ"><ValueText>{schedule.weekdayLabel}</ValueText></DetailRow>
          <DetailRow label="Thời gian"><ValueText>{schedule.timeLabel || "Chưa cập nhật"}</ValueText></DetailRow>
          <DetailRow label="Cơ sở"><ValueText>{schedule.branchName || "Chưa cập nhật"}</ValueText></DetailRow>
          {schedule.startDate ? (
            <DetailRow label="Thời hạn">
              <ValueText>{formatDate(schedule.startDate)} – {formatDate(schedule.endDate)}</ValueText>
            </DetailRow>
          ) : null}
          {schedule.statusLabel ? (
            <DetailRow label="Trạng thái">
              <View style={[styles.statusBadge, isActive ? null : styles.inactiveStatusBadge]}>
                <ThemedText type="caption" style={[styles.statusText, isActive ? null : styles.inactiveStatusText]}>{schedule.statusLabel}</ThemedText>
              </View>
            </DetailRow>
          ) : null}
          <DetailRow label="HLV chính" last={remaining.length === 0}>
            <View style={styles.primaryValue}>
              <ValueText>{primaryName ?? "Chưa phân công HLV chính"}</ValueText>
              <View style={styles.primaryBadge}>
                <ThemedText type="caption" style={styles.primaryBadgeText}>HLV chính</ThemedText>
              </View>
            </View>
          </DetailRow>
          {remaining.map((item, index) => (
            <DetailRow key={item.id} label={item.roleLabel} last={index === remaining.length - 1}>
              <ValueText>{item.fullName}</ValueText>
            </DetailRow>
          ))}
        </View>
      ) : null}
    </BottomSheetWindow>
  );
}

function ValueText({ children }: { children: ReactNode }) {
  return <ThemedText type="bodySmall" style={styles.value} selectable>{children}</ThemedText>;
}

function DetailRow({ label, children, last = false }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <View style={[styles.row, last ? styles.lastRow : null]}>
      <ThemedText type="bodySmall" style={styles.label}>{label}</ThemedText>
      <View style={styles.valueWrapper}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.two, paddingTop: Spacing.one, paddingBottom: Spacing.four },
  row: { minHeight: 48, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.three, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.light.divider },
  lastRow: { borderBottomWidth: 0 },
  label: { width: 116, color: Colors.light.textSecondary },
  valueWrapper: { flex: 1, minWidth: 0, alignItems: "flex-end", justifyContent: "center" },
  value: { color: Colors.light.text, fontWeight: "600", textAlign: "right" },
  eventType: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  eventDot: { width: 8, height: 8, borderRadius: radii.pill, backgroundColor: Colors.light.accent },
  eventText: { color: Colors.light.accent, fontWeight: "600" },
  statusBadge: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: radii.pill, backgroundColor: Colors.light.successSoft },
  statusText: { color: Colors.light.success, fontWeight: "700" },
  inactiveStatusBadge: { backgroundColor: Colors.light.backgroundElement },
  inactiveStatusText: { color: Colors.light.textSecondary },
  primaryValue: { alignItems: "flex-end", gap: Spacing.one },
  primaryBadge: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: radii.pill, backgroundColor: hexToRgba(Colors.light.primary, 0.1) },
  primaryBadgeText: { color: Colors.light.primary, fontWeight: "700" },
});
