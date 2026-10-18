/* eslint-disable react-hooks/refs -- web hook exposes reactive camera state alongside its DOM ref. */
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { Colors, Spacing, radii } from "@/theme";
import { ThemedText } from "@/shared/ui/ThemedText";

import { backendOrder } from "../ai/backendSelector.web";
import { kneeCounterEnabled } from "../config/featureFlags";
import { exportRepEventsCsv } from "../domain/groupEvaluator";
import { useCamera } from "../hooks/useCamera.web";
import { useKneeCounter } from "../hooks/useKneeCounter.web";
import { KneeCounterDashboard } from "../components/KneeCounterDashboard.web";
import { KneeCounterDiagnostics } from "../components/KneeCounterDiagnostics.web";
import { PoseOverlay } from "../components/PoseOverlay.web";

export function KneeCounterScreen() {
  const camera = useCamera();
  const counter = useKneeCounter(camera.videoRef);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });
  const backendOptions = useMemo(() => backendOrder(counter.config.backendPreference, counter.capabilities ?? { webglSupported: true, webgpuAdapterAvailable: false }), [counter.capabilities, counter.config.backendPreference]);

  if (!kneeCounterEnabled) {
    return <StackScreenLayout title="AI Knee Counter"><View style={styles.center}><ThemedText type="heading" style={styles.title}>Tính năng chưa được bật</ThemedText><ThemedText type="body" style={styles.secondary}>Quản trị viên cần bật EXPO_PUBLIC_KNEE_COUNTER_ENABLED cho môi trường Web.</ThemedText></View></StackScreenLayout>;
  }

  const exportCsv = () => {
    const csv = exportRepEventsCsv(counter.events);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `knee-counter-${new Date().toISOString().replaceAll(":", "-")}.csv`; anchor.click();
    URL.revokeObjectURL(url);
  };

  const start = async () => { if (await camera.start()) await counter.start(); };
  const stop = async () => { await counter.stop(); camera.stop(); };

  return (
    <StackScreenLayout title="AI Knee Counter" contentContainerStyle={styles.content}>
      <View style={styles.intro}><ThemedText type="heading" style={styles.title}>Đếm rút gối realtime</ThemedText><ThemedText type="bodySmall" style={styles.secondary}>Xử lý trực tiếp trên trình duyệt · Chrome/Edge Windows</ThemedText></View>
      <View style={styles.cameraCard}>
        <View style={styles.videoFrame}>
          <video ref={camera.videoRef} onLoadedMetadata={(event) => setVideoSize({ width: event.currentTarget.videoWidth || 1280, height: event.currentTarget.videoHeight || 720 })} style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#111" }} playsInline muted />
          <PoseOverlay slots={counter.slots} width={videoSize.width} height={videoSize.height} />
          {!camera.running ? <View style={styles.videoHint}><ThemedText type="body" style={styles.videoHintText}>Bật camera để bắt đầu</ThemedText></View> : null}
        </View>
        {camera.error ? <ThemedText accessibilityRole="alert" type="bodySmall" style={styles.error}>{camera.error}</ThemedText> : null}
        {counter.error ? <ThemedText accessibilityRole="alert" type="bodySmall" style={styles.error}>{counter.error}</ThemedText> : null}
        <View style={styles.actionRow}>
          <Action label={camera.running && counter.status === "paused" ? "Tiếp tục" : "Bật camera"} primary={!camera.running} disabled={counter.status === "starting"} onPress={camera.running && counter.status === "paused" ? counter.resume : start} />
          {camera.running ? <Action label="Tạm dừng" onPress={counter.pause} disabled={counter.status !== "running"} /> : null}
          {camera.running ? <Action label="Dừng" onPress={() => void stop()} /> : null}
        </View>
      </View>
      <View style={styles.controls}>
        <ControlGroup title="Số người"><View style={styles.chips}>{[2, 3, 4, 5, 6].map((count) => <Chip key={count} label={String(count)} selected={counter.config.participantCount === count} onPress={() => counter.updateConfig({ participantCount: count })} />)}</View></ControlGroup>
        <ControlGroup title={`Ngưỡng gối: ${counter.config.thresholdPercent}%`}><View style={styles.chips}>{[-30, -20, -10, 0, 10, 20, 30].map((value) => <Chip key={value} label={`${value}%`} selected={counter.config.thresholdPercent === value} onPress={() => counter.updateConfig({ thresholdPercent: value })} />)}</View></ControlGroup>
        <ControlGroup title="Backend"><View style={styles.chips}><Chip label="Tự động" selected={counter.config.backendPreference === "auto"} onPress={() => counter.updateConfig({ backendPreference: "auto" })} />{backendOptions.map((backend) => <Chip key={backend} label={backend} selected={counter.config.backendPreference === backend} onPress={() => counter.updateConfig({ backendPreference: backend })} />)}</View></ControlGroup>
        <ControlGroup title="Profile"><View style={styles.chips}>{(["performance", "balanced", "quality"] as const).map((profile) => <Chip key={profile} label={profile} selected={counter.config.profile === profile} onPress={() => counter.updateConfig({ profile })} />)}</View></ControlGroup>
        <ControlGroup title="Chế độ đếm"><View style={styles.chips}><Chip label="Cá nhân" selected={counter.config.mode === "individual"} onPress={() => counter.updateConfig({ mode: "individual" })} /><Chip label="Nhóm đạt" selected={counter.config.mode === "current-group-pass"} onPress={() => counter.updateConfig({ mode: "current-group-pass" })} /><Chip label="Đồng bộ" selected={counter.config.mode === "synchronized-group"} onPress={() => counter.updateConfig({ mode: "synchronized-group" })} /></View></ControlGroup>
        {camera.devices.length > 1 ? <ControlGroup title="Camera"><View style={styles.chips}>{camera.devices.map((device, index) => <Chip key={device.deviceId} label={device.label || `Camera ${index + 1}`} selected={camera.deviceId === device.deviceId} onPress={() => { camera.setDeviceId(device.deviceId); void stop(); }} />)}</View></ControlGroup> : null}
      </View>
      <KneeCounterDashboard slots={counter.slots} detectedCount={counter.detectedCount} passCount={counter.passCount} groupPassCount={counter.groupPassCount} synchronizedGroupPass={counter.synchronizedGroupPass} mode={counter.config.mode} status={counter.status} onReset={counter.reset} onExport={exportCsv} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDiagnostics }} onPress={() => setShowDiagnostics((value) => !value)} style={styles.diagnosticsToggle}><ThemedText type="bodySmall" style={styles.secondary}>{showDiagnostics ? "Ẩn chẩn đoán" : "Hiện chẩn đoán"}</ThemedText></Pressable>
      {showDiagnostics ? <KneeCounterDiagnostics capabilities={counter.capabilities} /> : null}
    </StackScreenLayout>
  );
}

function ControlGroup({ title, children }: { title: string; children: React.ReactNode }) { return <View style={styles.controlGroup}><ThemedText type="bodySmall" style={styles.controlTitle}>{title}</ThemedText>{children}</View>; }
function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) { return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}><ThemedText type="bodySmall" style={selected ? styles.chipSelectedText : styles.chipText}>{label}</ThemedText></Pressable>; }
function Action({ label, primary = false, disabled = false, onPress }: { label: string; primary?: boolean; disabled?: boolean; onPress: () => void | Promise<void> }) { return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={() => void onPress()} style={({ pressed }) => [styles.action, primary && styles.primaryAction, disabled && styles.disabled, pressed && styles.pressed]}><ThemedText type="action" style={primary ? styles.primaryText : styles.title}>{label}</ThemedText></Pressable>; }

const styles = StyleSheet.create({
  content: { gap: Spacing.four, paddingBottom: 40 },
  intro: { gap: 4 }, title: { color: Colors.light.text }, secondary: { color: Colors.light.textSecondary },
  center: { flex: 1, minHeight: 420, justifyContent: "center", alignItems: "center", gap: Spacing.two, padding: Spacing.four },
  cameraCard: { gap: Spacing.two, padding: Spacing.three, borderRadius: radii.lg, backgroundColor: Colors.light.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.light.divider },
  videoFrame: { width: "100%", aspectRatio: 16 / 9, position: "relative", overflow: "hidden", borderRadius: radii.md, backgroundColor: "#111" },
  videoHint: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" }, videoHintText: { color: Colors.light.surface }, error: { color: Colors.light.error },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two }, action: { minHeight: 48, flex: 1, minWidth: 120, alignItems: "center", justifyContent: "center", borderRadius: radii.md, borderWidth: 1, borderColor: Colors.light.divider, paddingHorizontal: Spacing.three }, primaryAction: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, primaryText: { color: Colors.light.surface }, disabled: { opacity: 0.5 }, pressed: { opacity: 0.78 },
  controls: { gap: Spacing.three, padding: Spacing.three, borderRadius: radii.lg, backgroundColor: Colors.light.surface }, controlGroup: { gap: Spacing.one }, controlTitle: { color: Colors.light.text, fontWeight: "700" }, chips: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.one }, chip: { minHeight: 40, justifyContent: "center", borderRadius: radii.pill, borderWidth: 1, borderColor: Colors.light.divider, paddingHorizontal: Spacing.three }, chipSelected: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary }, chipText: { color: Colors.light.textSecondary }, chipSelectedText: { color: Colors.light.surface }, diagnosticsToggle: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
});
