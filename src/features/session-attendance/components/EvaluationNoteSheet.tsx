import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { BottomSheetWindow } from "@/shared/ui/BottomSheetWindow";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, radii } from "@/theme";

import type { EvaluationStudent } from "../api/session-attendance.dto";
import type { EvaluationStatus } from "../constants/session-attendance.constants";
import { EVALUATION_CONFIG } from "./StatusPickerPopover";

const EVALUATION_OPTIONS: EvaluationStatus[] = [
  "GOOD",
  "AVERAGE",
  "WEAK",
  "PENDING",
];
const NOTE_TEMPLATES = [
  "Tập trung tốt, kỹ thuật chuẩn",
  "Cần cải thiện tư thế",
  "Tiến bộ rõ rệt",
  "Cần ôn lại bài cũ",
  "Sức bền tốt",
];

export function EvaluationNoteSheet({
  student,
  visible,
  saving,
  onClose,
  onSave,
}: {
  student: EvaluationStudent | null;
  visible: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (status: EvaluationStatus, note: string | null) => Promise<boolean>;
}) {
  if (!student) return null;

  return (
    <EvaluationNoteSheetContent
      key={student.studentEnrollment.studentEnrollmentId}
      student={student}
      visible={visible}
      saving={saving}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function EvaluationNoteSheetContent({
  student,
  visible,
  saving,
  onClose,
  onSave,
}: {
  student: EvaluationStudent;
  visible: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (status: EvaluationStatus, note: string | null) => Promise<boolean>;
}) {
  const [status, setStatus] = useState<EvaluationStatus>(
    student.attendance?.evaluationStatus ?? "PENDING",
  );
  const [note, setNote] = useState(student.attendance?.note ?? "");
  const studentName = student.studentEnrollment.studentPerson.fullName;

  return (
    <BottomSheetWindow
      visible={visible}
      title="Nhận xét buổi học"
      accessibilityLabel={`Đánh giá buổi học của ${studentName}`}
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={onClose}
            style={({ pressed }) => [
              styles.secondaryButton,
              activeEffect(pressed, "pressedScale"),
            ]}
          >
            <ThemedText type="action" style={styles.secondaryButtonText}>
              Hủy
            </ThemedText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: saving, disabled: saving }}
            disabled={saving}
            onPress={async () => {
              const saved = await onSave(status, note.trim() || null);
              if (saved) onClose();
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              activeEffect(pressed, "pressedScale"),
              saving ? styles.disabled : null,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={Colors.light.surface} />
            ) : (
              <ThemedText type="action" style={styles.primaryButtonText}>
                Lưu nhận xét
              </ThemedText>
            )}
          </Pressable>
        </View>
      }
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        <ThemedText type="subtitle" style={styles.studentName}>
          {studentName}
        </ThemedText>
        <ThemedText type="bodySmall" style={styles.sectionLabel}>
          Đánh giá buổi học
        </ThemedText>
        <View style={styles.optionGrid}>
          {EVALUATION_OPTIONS.map((value) => {
            const config = EVALUATION_CONFIG[value];
            const selected = status === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setStatus(value)}
                style={({ pressed }) => [
                  styles.option,
                  {
                    borderColor: selected ? config.border : Colors.light.divider,
                    backgroundColor: selected
                      ? config.bg
                      : Colors.light.surface,
                  },
                  activeEffect(pressed, "pressedScale"),
                ]}
              >
                <ThemedText
                  type="bodySmall"
                  style={[
                    styles.optionText,
                    selected ? { color: config.text } : null,
                  ]}
                >
                  {config.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText type="bodySmall" style={styles.sectionLabel}>
          Ghi chú của HLV
        </ThemedText>
        <TextInput
          accessibilityLabel="Ghi chú của huấn luyện viên"
          multiline
          maxLength={500}
          value={note}
          onChangeText={setNote}
          placeholder="Nhập nhận xét, lưu ý về học viên..."
          placeholderTextColor={Colors.light.textSecondary}
          style={styles.input}
        />
        <ThemedText type="caption" style={styles.characterCount}>
          {note.length}/500
        </ThemedText>

        <ThemedText type="bodySmall" style={styles.sectionLabel}>
          Mẫu ghi chú nhanh
        </ThemedText>
        <View style={styles.templates}>
          {NOTE_TEMPLATES.map((template) => (
            <Pressable
              key={template}
              accessibilityRole="button"
              onPress={() =>
                setNote((current) =>
                  current ? `${current}. ${template}` : template,
                )
              }
              style={({ pressed }) => [
                styles.template,
                activeEffect(pressed, "pressedScale"),
              ]}
            >
              <ThemedText type="caption" style={styles.templateText}>
                + {template}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </KeyboardAvoidingView>
    </BottomSheetWindow>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 8 },
  studentName: { color: Colors.light.text },
  sectionLabel: { color: Colors.light.text, fontWeight: "600" },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    minHeight: 44,
    width: "48%",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: 10,
  },
  optionText: { color: Colors.light.text, fontWeight: "600" },
  input: {
    minHeight: 112,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.md,
    padding: 12,
    color: Colors.light.text,
    backgroundColor: Colors.light.surface,
    textAlignVertical: "top",
  },
  characterCount: { alignSelf: "flex-end", color: Colors.light.textSecondary },
  templates: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  template: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.pill,
    backgroundColor: Colors.light.backgroundElement,
  },
  templateText: { color: Colors.light.textSecondary },
  footer: { flexDirection: "row", gap: 12 },
  secondaryButton: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.divider,
    borderRadius: radii.md,
    backgroundColor: Colors.light.surface,
  },
  secondaryButtonText: { color: Colors.light.text },
  primaryButton: {
    minHeight: 48,
    flex: 1.4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: Colors.light.primary,
  },
  primaryButtonText: { color: Colors.light.surface },
  disabled: { opacity: 0.55 },
});
