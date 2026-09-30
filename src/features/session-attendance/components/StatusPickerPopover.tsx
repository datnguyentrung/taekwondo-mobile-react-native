import { Modal, Pressable, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { Check, Clock, DocText, Star, X } from "reicon-react-native";

import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";
import { Colors, activeEffect, effects, radii } from "@/theme";
import type { AppIconElement } from "@/theme/icons";

import type {
  AttendanceStatus,
  EvaluationStatus,
} from "../constants/session-attendance.constants";
import {
  AttendanceStatusLabel,
  EvaluationStatusLabel,
} from "../constants/session-attendance.constants";

export const ATTENDANCE_CONFIG: Record<
  AttendanceStatus,
  {
    label: string;
    shortLabel: string;
    bg: string;
    text: string;
    border: string;
    icon: AppIconElement;
  }
> = {
  PRESENT: {
    label: "Có mặt",
    shortLabel: "Có mặt",
    bg: "#ECFDF5",
    text: "#065F46",
    border: "#A7F3D0",
    icon: <Check />,
  },
  ABSENT: {
    label: "Vắng",
    shortLabel: "Vắng",
    bg: "#FEF2F2",
    text: "#DC2626",
    border: "#FECACA",
    icon: <X />,
  },
  LATE: {
    label: "Đi muộn",
    shortLabel: "Muộn",
    bg: "#FFFBEB",
    text: "#D97706",
    border: "#FDE68A",
    icon: <Clock />,
  },
  EXCUSED: {
    label: "Có phép",
    shortLabel: "Phép",
    bg: "#EFF6FF",
    text: "#2563EB",
    border: "#BFDBFE",
    icon: <DocText />,
  },
  MAKEUP: {
    label: "Học bù",
    shortLabel: "Học bù",
    bg: "#F5F3FF",
    text: "#7C3AED",
    border: "#DDD6FE",
    icon: <Clock />,
  },
};

export const EVALUATION_CONFIG: Record<
  EvaluationStatus,
  {
    label: string;
    shortLabel: string;
    bg: string;
    text: string;
    border: string;
    icon: AppIconElement;
  }
> = {
  GOOD: {
    label: "Tốt",
    shortLabel: "Tốt",
    bg: "#ECFDF5",
    text: "#065F46",
    border: "#A7F3D0",
    icon: <Star />,
  },
  AVERAGE: {
    label: "Trung bình",
    shortLabel: "T.Bình",
    bg: "#FFFBEB",
    text: "#D97706",
    border: "#FDE68A",
    icon: <Clock />,
  },
  WEAK: {
    label: "Yếu",
    shortLabel: "Yếu",
    bg: "#FEF2F2",
    text: "#DC2626",
    border: "#FECACA",
    icon: <X />,
  },
  PENDING: {
    label: "Chờ đánh giá",
    shortLabel: "Chờ",
    bg: "#F3F4F6",
    text: "#4B5563",
    border: "#E5E7EB",
    icon: <Clock />,
  },
};

type StatusPickerPopoverProps =
  | {
      type: "attendance";
      visible: boolean;
      currentValue?: AttendanceStatus | null;
      studentName: string;
      onSelect: (val: AttendanceStatus) => void;
      onClose: () => void;
    }
  | {
      type: "evaluation";
      visible: boolean;
      currentValue?: EvaluationStatus | null;
      studentName: string;
      onSelect: (val: EvaluationStatus) => void;
      onClose: () => void;
    };

export function StatusPickerPopover(props: StatusPickerPopoverProps) {
  const { visible, onClose, studentName, type } = props;

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.popoverCard}>
              <View style={styles.header}>
                <ThemedText type="caption" style={styles.headerSubtitle}>
                  {type === "attendance"
                    ? "CẬP NHẬT ĐIỂM DANH"
                    : "CẬP NHẬT ĐÁNH GIÁ"}
                </ThemedText>
                <ThemedText
                  type="subtitle"
                  numberOfLines={1}
                  style={styles.headerTitle}
                >
                  {studentName}
                </ThemedText>
              </View>

              <View style={styles.optionsList}>
                {type === "attendance" ? (
                  (
                    [
                      "PRESENT",
                      "LATE",
                      "EXCUSED",
                      "MAKEUP",
                      "ABSENT",
                    ] as AttendanceStatus[]
                  ).map((key) => {
                    const cfg = ATTENDANCE_CONFIG[key];
                    const isSelected = props.currentValue === key;
                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityLabel={AttendanceStatusLabel[key]}
                        onPress={() => {
                          props.onSelect(key);
                          onClose();
                        }}
                        style={({ pressed }) => [
                          styles.optionItem,
                          { backgroundColor: cfg.bg, borderColor: cfg.border },
                          isSelected ? styles.optionItemSelected : null,
                          activeEffect(pressed, "pressedScale"),
                        ]}
                      >
                        <View style={styles.optionLeft}>
                          <AppIcon icon={cfg.icon} size={16} color={cfg.text} />
                          <ThemedText
                            type="body"
                            style={[styles.optionText, { color: cfg.text }]}
                          >
                            {cfg.label}
                          </ThemedText>
                        </View>
                        {isSelected ? (
                          <View
                            style={[styles.checkDot, { backgroundColor: cfg.text }]}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })
                ) : (
                  (
                    ["GOOD", "AVERAGE", "WEAK", "PENDING"] as EvaluationStatus[]
                  ).map((key) => {
                    const cfg = EVALUATION_CONFIG[key];
                    const isSelected = props.currentValue === key;
                    return (
                      <Pressable
                        key={key}
                        accessibilityRole="button"
                        accessibilityLabel={EvaluationStatusLabel[key]}
                        onPress={() => {
                          props.onSelect(key);
                          onClose();
                        }}
                        style={({ pressed }) => [
                          styles.optionItem,
                          { backgroundColor: cfg.bg, borderColor: cfg.border },
                          isSelected ? styles.optionItemSelected : null,
                          activeEffect(pressed, "pressedScale"),
                        ]}
                      >
                        <View style={styles.optionLeft}>
                          <AppIcon icon={cfg.icon} size={16} color={cfg.text} />
                          <ThemedText
                            type="body"
                            style={[styles.optionText, { color: cfg.text }]}
                          >
                            {cfg.label}
                          </ThemedText>
                        </View>
                        {isSelected ? (
                          <View
                            style={[styles.checkDot, { backgroundColor: cfg.text }]}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  popoverCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: Colors.light.surface,
    borderRadius: radii.xl,
    padding: 20,
    ...effects.card,
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.light.divider,
    paddingBottom: 10,
  },
  headerSubtitle: {
    color: Colors.light.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  headerTitle: {
    color: Colors.light.text,
    fontSize: 17,
  },
  optionsList: {
    gap: 10,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  optionItemSelected: {
    borderWidth: 2,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  optionText: {
    fontWeight: "600",
    fontSize: 15,
  },
  checkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
