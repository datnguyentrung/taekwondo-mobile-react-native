import { Pressable, StyleSheet, View } from "react-native";

import { Colors, Spacing, radii } from "@/theme";
import { ThemedText } from "@/shared/ui/ThemedText";

import type { CounterMode, ParticipantSlot } from "../types/kneeCounter.types";

function actionStyle(pressed: boolean, primary = false) {
  return [styles.action, primary && styles.primaryAction, pressed && styles.pressed];
}

export function KneeCounterDashboard({ slots, detectedCount, passCount, groupPassCount, synchronizedGroupPass, mode, status, onReset, onExport }: { slots: ParticipantSlot[]; detectedCount: number; passCount: number; groupPassCount: number; synchronizedGroupPass: boolean; mode: CounterMode; status: string; onReset: () => void; onExport: () => void }) {
  return (
    <View style={styles.panel}>
      <View style={styles.summaryRow}>
        <Metric label="Phát hiện" value={String(detectedCount)} />
        <Metric label={mode === "individual" ? "Đạt hiện tại" : mode === "current-group-pass" ? "Nhóm đạt" : "Đồng bộ"} value={mode === "individual" ? String(passCount) : mode === "current-group-pass" ? String(groupPassCount) : synchronizedGroupPass ? "Có" : "Chưa"} />
        <Metric label="Trạng thái" value={status} />
      </View>
      <View style={styles.participants}>
        {slots.map((slot) => (
          <View key={slot.participantId} style={styles.participantCard}>
            <View style={styles.participantHeading}><ThemedText type="title" style={styles.title}>{slot.label}</ThemedText><ThemedText type="caption" style={styles.secondary}>{slot.trackId === null ? "Chưa nhận diện" : `Track ${slot.trackId}`}</ThemedText></View>
            <ThemedText type="bodySmall" style={styles.status}>Trái: {slot.leftEvaluation} · {slot.leftReps} lượt</ThemedText>
            <ThemedText type="bodySmall" style={styles.status}>Phải: {slot.rightEvaluation} · {slot.rightReps} lượt</ThemedText>
          </View>
        ))}
      </View>
      <View style={styles.actionRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Đặt lại bộ đếm" onPress={onReset} style={({ pressed }) => actionStyle(pressed)}><ThemedText type="action">Đặt lại</ThemedText></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Xuất CSV" onPress={onExport} style={({ pressed }) => actionStyle(pressed, true)}><ThemedText type="action" style={styles.primaryText}>Xuất CSV</ThemedText></Pressable>
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><ThemedText type="caption" style={styles.secondary}>{label}</ThemedText><ThemedText type="subtitle" style={styles.title}>{value}</ThemedText></View>; }

const styles = StyleSheet.create({
  panel: { gap: Spacing.three, padding: Spacing.four, borderRadius: radii.lg, backgroundColor: Colors.light.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.light.divider },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.four },
  metric: { minWidth: 110, gap: 2 },
  participants: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  participantCard: { minWidth: 180, flexGrow: 1, gap: 4, padding: Spacing.three, borderRadius: radii.md, backgroundColor: Colors.light.backgroundElement },
  participantHeading: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: Spacing.two },
  title: { color: Colors.light.text },
  secondary: { color: Colors.light.textSecondary },
  status: { color: Colors.light.textSecondary },
  actionRow: { flexDirection: "row", gap: Spacing.two },
  action: { minHeight: 48, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: radii.md, borderWidth: 1, borderColor: Colors.light.divider, paddingHorizontal: Spacing.three },
  primaryAction: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  primaryText: { color: Colors.light.surface },
  pressed: { opacity: 0.78 },
});
