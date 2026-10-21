import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";

import { FlipH, Maximize, Minimize } from "reicon-react-native";

import { useToast } from "@/shared/ui/Toast";
import StackScreenLayout from "@/routes/navigation/layouts/StackScreenLayout";
import { Colors, Spacing, radii } from "@/theme";
import { AppIcon } from "@/shared/ui/AppIcon";
import { ThemedText } from "@/shared/ui/ThemedText";

import { kneeCounterEnabled } from "../config/featureFlags";
import { exportRepEventsCsv } from "../domain/groupEvaluator";
import { useCamera } from "../hooks/useCamera.web";
import { useKneeCounter } from "../hooks/useKneeCounter.web";
import { KneeCounterDashboard } from "../components/KneeCounterDashboard.web";
import { KneeCounterDiagnostics } from "../components/KneeCounterDiagnostics.web";
import { PoseOverlay } from "../components/PoseOverlay.web";
import { AnalysisSettings } from "../components/AnalysisSettings.web";
import { CameraStatusStrip } from "../components/CameraStatusStrip.web";
import { playRefereeBuzzer } from "../utils/buzzerAudio.web";
import type { CameraFpsOption } from "../types/kneeCounter.types";

export function KneeCounterScreen() {
  const toast = useToast();
  const {
    videoRef,
    devices: cameraDevices,
    deviceId: cameraDeviceId,
    setDeviceId: setCameraDeviceId,
    running: isCameraRunning,
    error: cameraError,
    settings: cameraSettings,
    capabilities: cameraCapabilities,
    start: startCamera,
    stop: stopCamera,
  } = useCamera();
  const [cameraTargetFps, setCameraTargetFps] = useState<CameraFpsOption>(30);
  const supportedCameraFps = useMemo<CameraFpsOption[]>(() => {
    const range = cameraCapabilities?.frameRate;
    if (!range || typeof range.max !== "number") return [];
    const max = range.max;
    const min = typeof range.min === "number" ? range.min : 0;
    return [15, 30, 45, 60, 90].filter((fps) => fps >= min && fps <= max) as CameraFpsOption[];
  }, [cameraCapabilities]);
  const activeCameraFps = supportedCameraFps.length && !supportedCameraFps.includes(cameraTargetFps)
    ? supportedCameraFps.at(-1)!
    : cameraTargetFps;
  const counter = useKneeCounter(videoRef, {
    requestedCameraFps: activeCameraFps,
    onFallbackToCpu: (message) => {
      toast.show({
        message,
        variant: "warning",
        duration: 5000,
      });
    },
  });
  const { width, height } = useWindowDimensions();
  const compact = width < 1100 || height < 620;
  const [settingsExpanded, setSettingsExpanded] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [videoSize, setVideoSize] = useState({ width: 1280, height: 720 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [countdownSeconds, setCountdownSeconds] = useState(30);
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const hasPlayedBuzzerRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const frameDimensions = useMemo(() => {
    if (compact || !containerSize.width || !containerSize.height) {
      return null;
    }
    const ar = videoSize.width && videoSize.height ? videoSize.width / videoSize.height : 16 / 9;
    const containerAr = containerSize.width / containerSize.height;
    if (containerAr > ar) {
      const h = Math.floor(containerSize.height);
      const w = Math.floor(h * ar);
      return { width: w, height: h };
    }
    const w = Math.floor(containerSize.width);
    const h = Math.floor(w / ar);
    return { width: w, height: h };
  }, [compact, containerSize.height, containerSize.width, videoSize.height, videoSize.width]);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (typeof document === "undefined") return;
      const element = document.getElementById("knee-counter-video-frame");
      if (!document.fullscreenElement) {
        if (element && element.requestFullscreen) {
          await element.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        }
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (counter.status !== "running") {
      hasPlayedBuzzerRef.current = false;
      return;
    }

    const startedAt = Date.now();
    hasPlayedBuzzerRef.current = false;

    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const rem = Math.max(0, Math.ceil(countdownSeconds - elapsed));
      setRemainingSeconds(rem);
      if (rem <= 0 && !hasPlayedBuzzerRef.current) {
        hasPlayedBuzzerRef.current = true;
        playRefereeBuzzer(1500);
        counter.pause();
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [countdownSeconds, counter]);

  const progressPercent = countdownSeconds > 0
    ? Math.min(100, Math.max(0, ((countdownSeconds - remainingSeconds) / countdownSeconds) * 100))
    : 0;
  const isTimeUp = remainingSeconds === 0 && (counter.status === "running" || counter.status === "paused");
  const isUrgent = remainingSeconds <= 5 && counter.status === "running";

  const exportCsv = () => {
    const csv = exportRepEventsCsv(counter.events);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `knee-counter-${new Date().toISOString().replaceAll(":", "-")}.csv`; anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!kneeCounterEnabled) {
    return <StackScreenLayout title="AI Knee Counter"><View style={styles.center}><ThemedText type="heading" style={styles.title}>Tính năng chưa được bật</ThemedText><ThemedText type="body" style={styles.secondary}>Quản trị viên cần bật EXPO_PUBLIC_KNEE_COUNTER_ENABLED cho môi trường Web.</ThemedText></View></StackScreenLayout>;
  }
  const start = async () => {
    if (await startCamera(activeCameraFps)) {
      await counter.start();
      setRemainingSeconds(countdownSeconds);
      hasPlayedBuzzerRef.current = false;
    }
  };
  const stop = async () => {
    await counter.stop();
    stopCamera();
    setRemainingSeconds(countdownSeconds);
    hasPlayedBuzzerRef.current = false;
  };
  const handleBeginCounting = () => {
    setRemainingSeconds(countdownSeconds);
    hasPlayedBuzzerRef.current = false;
    counter.beginCounting();
  };
  const handleReset = () => {
    counter.reset();
    setRemainingSeconds(countdownSeconds);
    hasPlayedBuzzerRef.current = false;
  };
  const cameraLabels = cameraDevices.map((device, index) => device.label || `Camera ${index + 1}`);
  const selectedCameraLabel = cameraDevices.find((device) => device.deviceId === cameraDeviceId)?.label;

  const workspace = <View style={[styles.workspace, compact && styles.workspaceCompact]}>
    <View style={[styles.leftColumn, compact && styles.leftColumnCompact]}>
      <View style={styles.intro}><ThemedText type="heading" style={styles.title}>Đếm rút gối realtime</ThemedText><ThemedText type="bodySmall" style={styles.secondary}>Xử lý trực tiếp trên trình duyệt · Chrome/Edge Windows</ThemedText></View>
      <View style={[styles.cameraCard, compact && styles.cameraCardCompact]}>
        <View
          style={[styles.videoContainer, compact && styles.videoContainerCompact]}
          onLayout={(event) => {
            const { width: w, height: h } = event.nativeEvent.layout;
            if (w > 0 && h > 0) {
              setContainerSize((prev) => {
                if (Math.abs(prev.width - w) < 1 && Math.abs(prev.height - h) < 1) return prev;
                return { width: w, height: h };
              });
            }
          }}
        >
          <View
            nativeID="knee-counter-video-frame"
            {...({ id: "knee-counter-video-frame" } as Record<string, unknown>)}
            style={[
              styles.videoFrame,
              isFullscreen
                ? styles.videoFrameFullscreen
                : compact
                  ? styles.videoFrameCompact
                  : frameDimensions
                    ? { width: frameDimensions.width, height: frameDimensions.height, aspectRatio: undefined }
                    : styles.videoFrameFallback,
            ]}
          >
            <video
              ref={videoRef}
              onLoadedMetadata={(event) => setVideoSize({ width: event.currentTarget.videoWidth || 1280, height: event.currentTarget.videoHeight || 720 })}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                backgroundColor: "#10141A",
                transform: counter.config.flipHorizontal ? "scaleX(-1)" : "none",
              }}
              playsInline
              muted
            />
            <PoseOverlay
              slots={counter.slots}
              width={videoSize.width}
              height={videoSize.height}
              config={counter.config}
              mirrored={counter.config.flipHorizontal}
            />
            <View style={styles.videoMeta}>
              <ThemedText type="caption" style={styles.videoMetaText}>{isCameraRunning ? "LIVE" : "SẴN SÀNG"}</ThemedText>
              <ThemedText type="caption" style={styles.videoMetaText}>{cameraSettings?.width ?? videoSize.width} x {cameraSettings?.height ?? videoSize.height} · camera {cameraSettings?.frameRate ? `${Math.round(cameraSettings.frameRate)} FPS` : "—"} · xử lý {counter.metrics.inferenceFps ? `${counter.metrics.inferenceFps} FPS` : "—"}</ThemedText>
              {counter.fallbackToCpu ? <ThemedText type="caption" style={styles.cpuBadgeText}>CPU (WASM)</ThemedText> : null}
            </View>
            <View style={styles.videoTopRight}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isFullscreen ? "Thu nhỏ camera" : "Toàn màn hình"}
                onPress={() => void toggleFullscreen()}
                style={({ pressed }) => [
                  styles.flipBadge,
                  isFullscreen && styles.flipBadgeActive,
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon
                  icon={isFullscreen ? <Minimize /> : <Maximize />}
                  size={14}
                  color={isFullscreen ? Colors.light.primary : Colors.light.surface}
                />
                <ThemedText
                  type="caption"
                  style={[
                    styles.flipBadgeText,
                    isFullscreen && styles.flipBadgeTextActive,
                  ]}
                >
                  {isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Lật ngang camera"
                accessibilityState={{ selected: counter.config.flipHorizontal }}
                onPress={() => counter.updateConfig({ flipHorizontal: !counter.config.flipHorizontal })}
                style={({ pressed }) => [
                  styles.flipBadge,
                  counter.config.flipHorizontal && styles.flipBadgeActive,
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon
                  icon={<FlipH />}
                  size={14}
                  color={counter.config.flipHorizontal ? Colors.light.primary : Colors.light.surface}
                />
                <ThemedText
                  type="caption"
                  style={[
                    styles.flipBadgeText,
                    counter.config.flipHorizontal && styles.flipBadgeTextActive,
                  ]}
                >
                  {counter.config.flipHorizontal ? "Đang lật ngang" : "Lật ngang"}
                </ThemedText>
              </Pressable>
            </View>
            {/* Bottom Countdown Processing Bar */}
            <View style={styles.bottomProgressBarContainer}>
              <View
                style={[
                  styles.bottomProgressBarFill,
                  {
                    width: `${progressPercent}%`,
                    backgroundColor: isTimeUp ? "#EF4444" : isUrgent ? "#F59E0B" : "#10B981",
                  },
                ]}
              />
            </View>
            {!isCameraRunning ? <View style={styles.videoHint}><ThemedText type="body" style={styles.videoHintText}>Bật camera để bắt đầu</ThemedText></View> : null}
          </View>
        </View>
        {cameraError ? <ThemedText accessibilityRole="alert" type="bodySmall" style={styles.error}>{cameraError}</ThemedText> : null}
        {counter.error ? <ThemedText accessibilityRole="alert" type="bodySmall" style={styles.error}>{counter.error}</ThemedText> : null}
        <CameraStatusStrip
          detectedCount={counter.detectedCount}
          status={counter.status}
          targetSeconds={countdownSeconds}
          onChangeTargetSeconds={(sec) => {
            setCountdownSeconds(sec);
            if (counter.status !== "running") setRemainingSeconds(sec);
          }}
          remainingSeconds={remainingSeconds}
          running={isCameraRunning}
          configuredCameraFps={cameraSettings?.frameRate ?? null}
          actualCameraFps={counter.metrics.videoCallbackFps ?? counter.metrics.cameraFps}
          inferenceFps={counter.metrics.inferenceFps}
          workerBusyDrops={counter.metrics.workerBusyDrops ?? counter.metrics.droppedFrames}
          capabilityFps={{ min: typeof cameraCapabilities?.frameRate?.min === "number" ? cameraCapabilities.frameRate.min : null, max: typeof cameraCapabilities?.frameRate?.max === "number" ? cameraCapabilities.frameRate.max : null }}
          busy={counter.status === "loading-model" || counter.status === "benchmarking"}
          onPrimaryAction={isCameraRunning && counter.status === "paused" ? counter.resume : isCameraRunning ? stop : start}
        />
        <View style={styles.actionRow}>
          {isCameraRunning && counter.status === "aligning" ? <Action label="Bắt đầu đếm" onPress={handleBeginCounting} /> : null}
          {isCameraRunning && counter.status === "countdown" ? <Action label="Đang chuẩn bị..." onPress={() => undefined} disabled /> : null}
          {isCameraRunning && counter.status !== "paused" ? <Action label="Tạm dừng" onPress={counter.pause} disabled={counter.status !== "running"} /> : null}
          {isCameraRunning ? <Action label="Dừng" onPress={() => void stop()} /> : null}
        </View>
      </View>
    </View>
    <ScrollView style={[styles.sidebarScroll, compact && styles.sidebarScrollCompact]} contentContainerStyle={styles.sidebarContent} showsVerticalScrollIndicator={false}>
      <AnalysisSettings config={counter.config} backendOptions={[]} cameraLabels={cameraLabels} selectedCameraId={selectedCameraLabel} expanded={settingsExpanded} onToggle={() => setSettingsExpanded((value) => !value)} onConfigChange={counter.updateConfig} cameraFps={activeCameraFps} cameraFpsOptions={supportedCameraFps} onCameraFpsChange={setCameraTargetFps} onCameraChange={(label) => { const device = cameraDevices.find((candidate, index) => (candidate.label || `Camera ${index + 1}`) === label); if (device) { setCameraDeviceId(device.deviceId); void stop(); } }} />
      <KneeCounterDashboard slots={counter.slots} detectedCount={counter.detectedCount} totalReps={counter.totalReps} passCount={counter.passCount} groupPassCount={counter.groupPassCount} synchronizedGroupPass={counter.synchronizedGroupPass} mode={counter.config.mode} status={counter.status} onReset={handleReset} onExport={exportCsv} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDiagnostics }} onPress={() => setShowDiagnostics((value) => !value)} style={styles.diagnosticsToggle}><ThemedText type="bodySmall" style={styles.secondary}>{showDiagnostics ? "Ẩn chẩn đoán" : "Hiện chẩn đoán"}</ThemedText></Pressable>
      {showDiagnostics ? <KneeCounterDiagnostics capabilities={counter.capabilities} trace={counter.trace} /> : null}
    </ScrollView>
  </View>;
  return <StackScreenLayout title="AI Knee Counter" scrollEnabled={compact} refreshEnabled={false} contentContainerStyle={[styles.content, compact && styles.contentCompact]}>{workspace}</StackScreenLayout>;
}

function Action({ label, disabled = false, onPress }: { label: string; disabled?: boolean; onPress: () => void | Promise<void> }) { return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={() => void onPress()} style={({ pressed }) => [styles.action, disabled && styles.disabled, pressed && styles.pressed]}><ThemedText type="action" style={styles.title}>{label}</ThemedText></Pressable>; }

const styles = StyleSheet.create({
  content: { flex: 1, minHeight: 0, paddingBottom: 16 },
  contentCompact: { flex: undefined, flexGrow: 1 },
  workspace: { flex: 1, minHeight: 0, flexDirection: "row", gap: Spacing.three },
  workspaceCompact: { flexDirection: "column", flex: undefined },
  leftColumn: { flex: 1, minWidth: 0, minHeight: 0, gap: Spacing.two },
  leftColumnCompact: { flex: undefined },
  sidebarScroll: { width: 410, minWidth: 360, flexGrow: 0, flexShrink: 0 },
  sidebarScrollCompact: { width: "100%", minWidth: 0 },
  sidebarContent: { gap: Spacing.three, paddingBottom: Spacing.four },
  intro: { gap: 4 },
  title: { color: Colors.light.text },
  secondary: { color: Colors.light.textSecondary },
  center: { flex: 1, minHeight: 420, justifyContent: "center", alignItems: "center", gap: Spacing.two, padding: Spacing.four },
  cameraCard: { flex: 1, minHeight: 0, gap: Spacing.two, padding: Spacing.three, borderRadius: radii.lg, backgroundColor: Colors.light.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.light.divider },
  cameraCardCompact: { flex: undefined },
  videoContainer: { flex: 1, minHeight: 0, width: "100%", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  videoContainerCompact: { flex: undefined, width: "100%" },
  videoFrame: { position: "relative", overflow: "hidden", borderRadius: radii.md, backgroundColor: "#10141A" },
  videoFrameCompact: { width: "100%", aspectRatio: 16 / 9 },
  videoFrameFullscreen: { width: "100%", height: "100%", borderRadius: 0 },
  videoFrameFallback: { width: "100%", height: "100%", maxHeight: "100%", maxWidth: "100%", aspectRatio: 16 / 9 },
  bottomProgressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    zIndex: 25,
    overflow: "hidden",
  },
  bottomProgressBarFill: {
    height: "100%",
  },
  videoMeta: { position: "absolute", top: 12, left: 12, flexDirection: "row", gap: Spacing.two, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: radii.pill, backgroundColor: "rgba(0,0,0,0.72)" },
  videoMetaText: { color: Colors.light.surface },
  cpuBadgeText: { color: "#F59E0B", fontWeight: "600" },
  videoTopRight: { position: "absolute", top: 12, right: 12, flexDirection: "row", gap: Spacing.two, zIndex: 10 },
  flipBadge: { flexDirection: "row", alignItems: "center", gap: Spacing.one, paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: radii.pill, backgroundColor: "rgba(0,0,0,0.72)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  flipBadgeActive: { backgroundColor: Colors.light.surface, borderColor: Colors.light.primary },
  flipBadgeText: { color: Colors.light.surface, fontWeight: "600" },
  flipBadgeTextActive: { color: Colors.light.primary },
  videoHint: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  videoHintText: { color: Colors.light.surface },
  error: { color: Colors.light.error },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  action: { minHeight: 48, flex: 1, minWidth: 120, alignItems: "center", justifyContent: "center", borderRadius: radii.md, borderWidth: 1, borderColor: Colors.light.divider, paddingHorizontal: Spacing.three },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78 },
  diagnosticsToggle: { alignSelf: "flex-start", minHeight: 44, justifyContent: "center" },
});
