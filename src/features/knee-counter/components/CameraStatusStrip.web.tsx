import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { Colors, Spacing, radii } from "@/theme";
import { ThemedText } from "@/shared/ui/ThemedText";

import type { SessionStatus } from "../types/kneeCounter.types";
import { formatSessionDuration } from "../utils/sessionClock.web";

type CameraStatusStripProps = {
  detectedCount: number;
  status: SessionStatus;
  targetSeconds: number;
  onChangeTargetSeconds: (seconds: number) => void;
  remainingSeconds: number;
  running: boolean;
  busy?: boolean;
  onPrimaryAction: () => void | Promise<void>;
  inferenceFps?: number | null;
};

function statusCopy(status: SessionStatus) {
  if (status === "running") return "Đang theo dõi";
  if (status === "paused") return "Đã tạm dừng";
  if (status === "finished") return "Kết thúc";
  if (status === "countdown") return "Đếm ngược";
  if (status === "loading-model" || status === "benchmarking") return "Đang tải";
  return "Đã sẵn sàng";
}

function actionCopy(status: SessionStatus, running: boolean) {
  if (!running) return "Bật camera";
  if (status === "paused") return "Tiếp tục";
  if (status === "countdown") return "Đang đếm ngược…";
  if (status === "finished") return "Kết thúc";
  return "Dừng camera";
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
  inferenceFps = null,
}: CameraStatusStripProps) {
  const isDurationLocked = status === "countdown" || status === "running" || status === "paused";
  const isUrgent = status === "running" && remainingSeconds <= 5 && remainingSeconds > 0;
  const isTimeUp = status === "finished";

  return (
    <View style={styles.strip}>
      <Metric icon="◉" label="Số vận động viên phát hiện" value={String(detectedCount)} detail="Đang theo dõi" />
      <Metric icon="▣" label="Trạng thái model" value={statusCopy(status)} detail={status === "loading-model" || status === "benchmarking" ? "Đang khởi tạo" : "Sẵn sàng"} />
      <Metric icon="ϟ" label="FPS xử lý thực tế" value={inferenceFps ? `${inferenceFps.toFixed(1)} FPS` : "— FPS"} />
      <View style={styles.metric}>
        <ThemedText type="caption" style={styles.metricLabel}>◷ &nbsp; Thời gian còn lại</ThemedText>
        {isDurationLocked ? (
          <ThemedText type="title" style={[styles.timerValue, isUrgent && styles.urgentValue, isTimeUp && styles.timeUpValue]}>{formatSessionDuration(remainingSeconds)}</ThemedText>
        ) : (
          <View style={styles.durationEditRow}>
            <TextInput
              accessibilityLabel="Thời gian đếm ngược theo giây"
              style={styles.targetInput}
              value={targetSeconds > 0 ? String(targetSeconds) : ""}
              placeholder="30"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="number-pad"
              editable={!isDurationLocked}
              onChangeText={(text) => {
                const seconds = parseInt(text.replace(/\D/g, ""), 10);
                onChangeTargetSeconds(isNaN(seconds) ? 0 : Math.min(999, Math.max(0, seconds)));
              }}
            />
            <ThemedText type="bodySmall" style={styles.unitText}>giây</ThemedText>
          </View>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy, disabled: busy || status === "countdown" || status === "finished" }}
        disabled={busy || status === "countdown" || status === "finished"}
        onPress={() => void onPrimaryAction()}
        style={({ pressed }) => [styles.primaryAction, (busy || status === "countdown" || status === "finished") && styles.disabled, pressed && styles.pressed]}
      >
        <ThemedText type="action" style={styles.primaryText}>{actionCopy(status, running)}</ThemedText>
      </Pressable>
    </View>
  );
}

function Metric({ icon, label, value, detail }: { icon: string; label: string; value: string; detail?: string }) {
  return (
    <View style={styles.metric}>
      <ThemedText type="caption" style={styles.metricLabel}>{icon} &nbsp; {label}</ThemedText>
      <ThemedText type="title" style={styles.metricValue}>{value}</ThemedText>
      {detail ? <View style={styles.detailRow}><View style={styles.liveDot} /><ThemedText type="caption" style={styles.detailText}>{detail}</ThemedText></View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: "row", alignItems: "stretch", flexWrap: "wrap", gap: Spacing.two, padding: Spacing.two, borderRadius: radii.lg, backgroundColor: "#061A2D", boxShadow: "0 7px 14px rgba(6,26,45,0.16)" },
  metric: { flex: 1, minWidth: 172, minHeight: 88, justifyContent: "center", gap: 5, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: radii.md, borderWidth: 1, borderColor: "rgba(255,255,255,0.11)", backgroundColor: "rgba(255,255,255,0.035)" },
  metricLabel: { color: "rgba(255,255,255,0.72)", fontSize: 12 },
  metricValue: { color: Colors.light.surface, fontWeight: "800", fontSize: 21, lineHeight: 26 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#31D158" },
  detailText: { color: "#58D96A", fontWeight: "700" },
  durationEditRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  targetInput: { width: 74, height: 36, borderRadius: radii.sm, borderWidth: 1, borderColor: "rgba(255,197,51,0.68)", backgroundColor: "rgba(255,197,51,0.08)", color: "#FFC533", paddingHorizontal: 8, paddingVertical: 2, fontSize: 21, fontWeight: "800", textAlign: "center", fontVariant: ["tabular-nums"] },
  unitText: { color: "rgba(255,255,255,0.72)" },
  timerValue: { color: "#FFC533", fontWeight: "800", fontSize: 25, lineHeight: 30, fontVariant: ["tabular-nums"] },
  urgentValue: { color: "#FBBF24" },
  timeUpValue: { color: "#F87171" },
  primaryAction: { flex: 1.12, minWidth: 190, minHeight: 88, alignItems: "center", justifyContent: "center", borderRadius: radii.md, paddingHorizontal: Spacing.three, backgroundColor: "#A51625" },
  primaryText: { color: Colors.light.surface, fontSize: 18, fontWeight: "800", textAlign: "center" },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.66 },
});
