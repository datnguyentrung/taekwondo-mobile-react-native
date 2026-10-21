import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Colors, Spacing, radii } from "@/theme";
import { ThemedText } from "@/shared/ui/ThemedText";

type CameraStatusStripProps = {
  detectedCount: number;
  status: string;
  targetSeconds: number;
  onChangeTargetSeconds: (seconds: number) => void;
  remainingSeconds: number;
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

export function CameraStatusStrip({
  detectedCount,
  status,
  targetSeconds,
  onChangeTargetSeconds,
  remainingSeconds,
  running,
  busy = false,
  onPrimaryAction,
}: CameraStatusStripProps) {
  const actionLabel = running ? (status === "paused" ? "Tiếp tục" : "Dừng camera") : "Bật camera";
  const statusLabel = status === "running" ? "Đang đếm" : status === "paused" ? "Đã tạm dừng" : status === "countdown" ? "Sắp bắt đầu" : status === "aligning" ? "Đang căn chỉnh" : status === "loading-model" || status === "benchmarking" ? "Đang tải model" : "Sẵn sàng";
  const isRunning = status === "running";
  const isUrgent = isRunning && remainingSeconds <= 5 && remainingSeconds > 0;
  const isTimeUp = remainingSeconds === 0 && (isRunning || status === "paused");

  return (
    <View style={styles.strip}>
      <Metric label="Số người phát hiện" value={String(detectedCount)} />
      <Metric label="Trạng thái" value={statusLabel} live={isRunning} />

      {/* Target countdown seconds input */}
      <View style={styles.metric}>
        <ThemedText type="caption" style={styles.metricLabel}>Đặt đếm ngược</ThemedText>
        <View style={styles.targetRow}>
          <TextInput
            accessibilityLabel="Thời gian đếm ngược theo giây"
            style={[styles.targetInput, isRunning && styles.targetInputDisabled]}
            value={targetSeconds > 0 ? String(targetSeconds) : ""}
            placeholder="30"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="number-pad"
            editable={!isRunning}
            onChangeText={(text) => {
              const num = parseInt(text.replace(/\D/g, ""), 10);
              onChangeTargetSeconds(isNaN(num) ? 0 : Math.min(999, Math.max(0, num)));
            }}
          />
          <ThemedText type="bodySmall" style={styles.unitText}>giây</ThemedText>
        </View>
      </View>

      {/* Remaining countdown timer */}
      <View style={styles.metric}>
        <ThemedText type="caption" style={styles.metricLabel}>Thời gian còn lại</ThemedText>
        <View style={styles.metricValueRow}>
          {isRunning ? <View style={[styles.liveDot, isUrgent && styles.urgentDot, isTimeUp && styles.timeUpDot]} /> : null}
          <ThemedText
            type="title"
            style={[
              styles.metricValue,
              isUrgent && styles.urgentValue,
              isTimeUp && styles.timeUpValue,
            ]}
          >
            {formatDuration(remainingSeconds)}
          </ThemedText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy, disabled: busy }}
        disabled={busy}
        onPress={() => void onPrimaryAction()}
        style={({ pressed }) => [
          styles.primaryAction,
          pressed && styles.pressed,
          busy && styles.disabled,
        ]}
      >
        <ThemedText type="action" style={styles.primaryText}>{actionLabel}</ThemedText>
      </Pressable>
    </View>
  );
}

function Metric({ label, value, live = false }: { label: string; value: string; live?: boolean }) {
  return (
    <View style={styles.metric}>
      <ThemedText type="caption" style={styles.metricLabel}>{label}</ThemedText>
      <View style={styles.metricValueRow}>
        {live ? <View style={styles.liveDot} /> : null}
        <ThemedText type="title" style={styles.metricValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: "#182331",
    borderRadius: radii.md,
  },
  metric: {
    flexGrow: 1,
    minWidth: 80,
    justifyContent: "center",
    gap: 4,
    paddingRight: Spacing.two,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(255,255,255,0.24)",
  },
  metricLabel: {
    color: "rgba(255,255,255,0.68)",
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  metricValue: {
    color: Colors.light.surface,
    fontWeight: "700",
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  targetInput: {
    minWidth: 50,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: radii.sm,
    color: Colors.light.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  targetInputDisabled: {
    opacity: 0.6,
  },
  unitText: {
    color: "rgba(255,255,255,0.72)",
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22C55E",
  },
  urgentDot: {
    backgroundColor: "#F59E0B",
  },
  timeUpDot: {
    backgroundColor: "#EF4444",
  },
  urgentValue: {
    color: "#FBBF24",
  },
  timeUpValue: {
    color: "#F87171",
  },
  primaryAction: {
    minHeight: 44,
    minWidth: 130,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    paddingHorizontal: Spacing.three,
    backgroundColor: Colors.light.primary,
  },
  primaryText: {
    color: Colors.light.surface,
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.5,
  },
});
