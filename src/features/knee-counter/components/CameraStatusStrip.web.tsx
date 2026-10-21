import { Pressable, StyleSheet, View } from "react-native";

import { Colors, Spacing, radii } from "@/theme";
import { ThemedText } from "@/shared/ui/ThemedText";

type CameraStatusStripProps = {
  detectedCount: number;
  status: string;
  totalReps: number;
  elapsedSeconds: number;
  running: boolean;
  busy?: boolean;
  onPrimaryAction: () => void | Promise<void>;
};

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const remainder = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export function CameraStatusStrip({ detectedCount, status, totalReps, elapsedSeconds, running, busy = false, onPrimaryAction }: CameraStatusStripProps) {
  const actionLabel = running ? (status === "paused" ? "Tiếp tục" : "Dừng camera") : "Bật camera";
  const statusLabel = status === "running" ? "Đang đếm" : status === "paused" ? "Đã tạm dừng" : status === "countdown" ? "Sắp bắt đầu" : status === "aligning" ? "Đang căn chỉnh" : status === "loading-model" || status === "benchmarking" ? "Đang tải model" : "Sẵn sàng";
  return (
    <View style={styles.strip}>
      <Metric label="Số người phát hiện" value={String(detectedCount)} />
      <Metric label="Trạng thái" value={statusLabel} live={status === "running"} />
      <Metric label="Tổng số gối" value={String(totalReps)} />
      <Metric label="Thời gian" value={formatDuration(elapsedSeconds)} />
      <Pressable accessibilityRole="button" accessibilityState={{ busy, disabled: busy }} disabled={busy} onPress={() => void onPrimaryAction()} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed, busy && styles.disabled]}>
        <ThemedText type="action" style={styles.primaryText}>{actionLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

function Metric({ label, value, live = false }: { label: string; value: string; live?: boolean }) {
  return <View style={styles.metric}><ThemedText type="caption" style={styles.metricLabel}>{label}</ThemedText><View style={styles.metricValueRow}>{live ? <View style={styles.liveDot} /> : null}<ThemedText type="title" style={styles.metricValue}>{value}</ThemedText></View></View>;
}

const styles = StyleSheet.create({
  strip: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: Spacing.two, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, backgroundColor: "#182331", borderRadius: radii.md },
  metric: { flexGrow: 1, minWidth: 72, justifyContent: "center", gap: 4, paddingRight: Spacing.two, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "rgba(255,255,255,0.24)" },
  metricLabel: { color: "rgba(255,255,255,0.68)" },
  metricValueRow: { flexDirection: "row", alignItems: "center", gap: Spacing.one },
  metricValue: { color: Colors.light.surface },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22C55E" },
  primaryAction: { minHeight: 44, minWidth: 130, flexGrow: 1, alignItems: "center", justifyContent: "center", borderRadius: radii.md, paddingHorizontal: Spacing.three, backgroundColor: Colors.light.primary },
  primaryText: { color: Colors.light.surface },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.5 },
});
