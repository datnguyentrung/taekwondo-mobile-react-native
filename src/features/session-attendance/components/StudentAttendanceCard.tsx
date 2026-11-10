import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Clock, Note } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, effects, radii } from "@/theme";

import type { EvaluationStudent } from "../api/session-attendance.dto";
import type {
  AttendanceStatus,
  EvaluationStatus,
} from "../constants/session-attendance.constants";
import {
  canEvaluateStudent,
  formatBeltName,
} from "../domain/sessionAttendancePresentation";
import {
  ATTENDANCE_CONFIG,
  EVALUATION_CONFIG,
  StatusPickerPopover,
} from "./StatusPickerPopover";

export function StudentAttendanceCard({
  item,
  canCreate,
  canUpdate,
  isPending,
  onUpdateAttendanceStatus,
  onUpdateEvaluationStatus,
  onOpenEvaluationNote,
}: {
  item: EvaluationStudent;
  canCreate: boolean;
  canUpdate: boolean;
  isPending: boolean;
  onUpdateAttendanceStatus: (newStatus: AttendanceStatus) => Promise<boolean>;
  onUpdateEvaluationStatus: (newStatus: EvaluationStatus) => Promise<boolean>;
  onOpenEvaluationNote: () => void;
}) {
  const [pickerType, setPickerType] = useState<"attendance" | null>(null);

  const student = item.studentEnrollment.studentPerson;
  const currentAttendance = item.attendance?.attendanceStatus ?? null;
  const currentEvaluation = item.attendance?.evaluationStatus ?? "PENDING";
  const evaluationAllowed = canEvaluateStudent(item);
  const canEditAttendance = item.attendance ? canUpdate : canCreate;
  const canEditEvaluation = canUpdate && evaluationAllowed;
  const attendanceConfig = currentAttendance
    ? ATTENDANCE_CONFIG[currentAttendance]
    : null;
  const initials = student.fullName
    ? student.fullName
        .split(" ")
        .map((name) => name[0])
        .slice(-2)
        .join("")
        .toUpperCase()
    : "HV";

  return (
    <>
      <View style={styles.card}>
        <View style={styles.studentInfoRow}>
          <View style={styles.avatar}>
            <ThemedText type="caption" style={styles.avatarText}>
              {initials}
            </ThemedText>
          </View>
          <View style={styles.nameWrap}>
            <ThemedText type="title" numberOfLines={2} style={styles.studentName}>
              {student.fullName}
            </ThemedText>
            <ThemedText type="bodySmall" style={styles.studentMeta}>
              {student.personCode || "Chưa có mã"} ·{" "}
              {formatBeltName(student.currentBelt)}
            </ThemedText>
          </View>
          {isPending ? (
            <ActivityIndicator
              accessibilityLabel="Đang cập nhật"
              color={Colors.light.primary}
            />
          ) : null}
        </View>

        <View style={styles.attendanceRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              attendanceConfig
                ? `Điểm danh: ${attendanceConfig.label}`
                : "Chưa điểm danh"
            }
            accessibilityState={{ disabled: !canEditAttendance }}
            disabled={!canEditAttendance}
            onPress={() => setPickerType("attendance")}
            style={({ pressed }) => [
              styles.attendanceButton,
              attendanceConfig
                ? {
                    backgroundColor: attendanceConfig.bg,
                    borderColor: attendanceConfig.border,
                  }
                : styles.unmarkedButton,
              !canEditAttendance ? styles.disabled : null,
              activeEffect(pressed, "pressedScale"),
            ]}
          >
            <AppIcon
              icon={attendanceConfig?.icon ?? <Clock />}
              size={16}
              color={attendanceConfig?.text ?? Colors.light.textSecondary}
            />
            <ThemedText
              type="bodySmall"
              numberOfLines={1}
              style={[
                styles.statusButtonText,
                {
                  color:
                    attendanceConfig?.text ?? Colors.light.textSecondary,
                },
              ]}
            >
              {attendanceConfig?.shortLabel ?? "Chưa điểm danh"}
            </ThemedText>
          </Pressable>

        </View>

        {evaluationAllowed ? (
          <View style={styles.evaluationRow}>
            {(["GOOD", "AVERAGE", "WEAK"] as const).map((value) => {
              const config = EVALUATION_CONFIG[value];
              const selected = currentEvaluation === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityLabel={"Đánh giá " + config.label}
                  accessibilityState={{
                    disabled: !canEditEvaluation,
                    selected,
                  }}
                  disabled={!canEditEvaluation}
                  onPress={() => {
                    if (!selected) {
                      void onUpdateEvaluationStatus(value);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.evaluationButton,
                    {
                      borderColor: selected
                        ? config.border
                        : Colors.light.divider,
                      backgroundColor: selected
                        ? config.bg
                        : Colors.light.surface,
                    },
                    !canEditEvaluation ? styles.disabled : null,
                    activeEffect(pressed, "pressedScale"),
                  ]}
                >
                  <AppIcon icon={config.icon} size={16} color={config.text} />
                  <ThemedText
                    type="bodySmall"
                    style={[
                      styles.statusButtonText,
                      { color: selected ? config.text : Colors.light.text },
                    ]}
                  >
                    {config.shortLabel}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.cannotEvaluateButton}>
            <AppIcon
              icon={<Clock />}
              size={16}
              color={Colors.light.textSecondary}
            />
            <ThemedText type="bodySmall" style={styles.cannotEvaluateText}>
              Chưa thể đánh giá
            </ThemedText>
          </View>
        )}

        {evaluationAllowed ? (
          <View style={styles.noteRow}>
            <ThemedText
              type="bodySmall"
              numberOfLines={2}
              style={styles.noteText}
            >
              {item.attendance?.note || "Chưa có nhận xét của HLV"}
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mở nhận xét chi tiết"
              accessibilityState={{ disabled: !canEditEvaluation }}
              disabled={!canEditEvaluation}
              onPress={onOpenEvaluationNote}
              style={({ pressed }) => [
                styles.noteButton,
                !canEditEvaluation ? styles.disabled : null,
                activeEffect(pressed, "pressedScale"),
              ]}
            >
              <AppIcon
                icon={<Note />}
                size={16}
                color={Colors.light.primary}
              />
              <ThemedText type="caption" style={styles.noteButtonText}>
                {item.attendance?.note ? "Sửa nhận xét" : "Nhận xét"}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
      </View>

      <StatusPickerPopover
        type="attendance"
        visible={pickerType === "attendance"}
        studentName={student.fullName}
        currentValue={currentAttendance}
        onSelect={(value) => {
          setPickerType(null);
          void onUpdateAttendanceStatus(value);
        }}
        onClose={() => setPickerType(null)}
      />

    </>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    marginBottom: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.lg,
    backgroundColor: Colors.light.surface,
    ...effects.soft,
  },
  studentInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.primarySoft,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.primarySoft,
  },
  avatarText: { color: Colors.light.primary },
  nameWrap: { flex: 1, gap: 2 },
  studentName: { color: Colors.light.text },
  studentMeta: { color: Colors.light.textSecondary },
  attendanceRow: { flexDirection: "row" },
  attendanceButton: {
    minHeight: 44,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  evaluationRow: { flexDirection: "row", gap: 8 },
  evaluationButton: {
    minHeight: 44,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  unmarkedButton: {
    borderColor: Colors.light.divider,
    backgroundColor: Colors.light.backgroundElement,
  },
  statusButtonText: { fontWeight: "700" },
  disabled: { opacity: 0.52 },
  cannotEvaluateButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.md,
    backgroundColor: Colors.light.backgroundElement,
  },
  cannotEvaluateText: {
    color: Colors.light.textSecondary,
    fontWeight: "700",
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.light.divider,
  },
  noteText: { flex: 1, color: Colors.light.textSecondary },
  noteButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: radii.md,
  },
  noteButtonText: { color: Colors.light.primary },
});
