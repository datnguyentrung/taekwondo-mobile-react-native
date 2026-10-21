import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { createKneeCounterWorker } from "../ai/createKneeCounterWorker.web";
import { detectComputeCapabilities } from "../ai/gpuCapabilities.web";
import type { KneeWorkerResponse } from "../ai/kneeWorkerProtocol";
import { MainThreadKneeRuntime } from "../ai/mainThreadKneeRuntime.web";
import { DEFAULT_KNEE_COUNTER_CONFIG } from "../config/kneeCounterConfig";
import {
  countCurrentGroupPass,
  isSynchronizedGroup,
} from "../domain/groupEvaluator";
import { RepEventLedger } from "../domain/repEventLedger";
import type {
  ComputeCapabilities,
  KneeCounterSessionConfig,
  ParticipantSlot,
  KneeTraceSample,
  RepEvent,
  SessionMetrics,
  SessionStatus,
  CameraFpsRange,
} from "../types/kneeCounter.types";

const EMPTY_METRICS: SessionMetrics = {
  cameraFps: null,
  inferenceFps: null,
  averageLatencyMs: null,
  p50LatencyMs: null,
  p95LatencyMs: null,
  processedFrames: 0,
  droppedFrames: 0,
  invalidSignalRate: null,
  idSwitches: 0,
  laneConflicts: 0,
  videoCallbackFps: null,
  videoFrameGapMs: null,
  presentedFrames: null,
  droppedVideoFrames: null,
  workerBusyDrops: 0,
};
export type UseKneeCounterOptions = {
  onFallbackToCpu?: (reason: string) => void;
  requestedCameraFps?: number;
};

export function useKneeCounter(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options?: UseKneeCounterOptions,
) {
  const [config, setConfig] = useState<KneeCounterSessionConfig>(
    DEFAULT_KNEE_COUNTER_CONFIG,
  );
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<ComputeCapabilities | null>(
    null,
  );
  const [fallbackToCpu, setFallbackToCpu] = useState(false);
  const [slots, setSlots] = useState<ParticipantSlot[]>([]);
  const [trace, setTrace] = useState<KneeTraceSample[]>([]);
  const [events, setEvents] = useState<RepEvent[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics>(EMPTY_METRICS);
  const workerRef = useRef<Worker | null>(null);
  const mainRuntimeRef = useRef<MainThreadKneeRuntime | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const inFlightRef = useRef(false);
  const cameraFrameTimesRef = useRef<number[]>([]);
  const droppedFramesRef = useRef(0);
  const countingRef = useRef(false);
  const workerReadyRef = useRef(false);
  const ledgerRef = useRef(new RepEventLedger());
  const sessionIdRef = useRef("");
  const sessionStartedAtRef = useRef("");
  const lastUpdateRef = useRef(0);
  const capabilitiesRef = useRef<ComputeCapabilities | null>(null);
  const hasNotifiedFallbackRef = useRef(false);
  const onFallbackToCpuRef = useRef(options?.onFallbackToCpu);
  const requestedCameraFpsRef = useRef(options?.requestedCameraFps ?? null);

  useEffect(() => {
    onFallbackToCpuRef.current = options?.onFallbackToCpu;
    requestedCameraFpsRef.current = options?.requestedCameraFps ?? null;
  }, [options?.onFallbackToCpu, options?.requestedCameraFps]);

  const notifyCpuFallback = useCallback((customReason?: string) => {
    setFallbackToCpu(true);
    if (hasNotifiedFallbackRef.current) return;
    hasNotifiedFallbackRef.current = true;
    const caps = capabilitiesRef.current;
    const noGpuHardware = caps && !caps.webglSupported && !caps.webgpuAdapterAvailable;
    const defaultReason = noGpuHardware
      ? "Không phát hiện GPU hỗ trợ. Đã chuyển sang xử lý bằng CPU (WASM), hiệu năng có thể bị giảm."
      : "Không thể sử dụng GPU hoặc khởi tạo GPU thất bại. Đã chuyển sang xử lý bằng CPU (WASM).";
    onFallbackToCpuRef.current?.(customReason ?? defaultReason);
  }, []);

  const dispose = useCallback(() => {
    stopLoopRef.current?.();
    stopLoopRef.current = null;
    inFlightRef.current = false;
    cameraFrameTimesRef.current = [];
    droppedFramesRef.current = 0;
    workerRef.current?.postMessage({ type: "dispose" });
    workerRef.current?.terminate();
    workerRef.current = null;
    mainRuntimeRef.current?.dispose();
    mainRuntimeRef.current = null;
  }, []);
  const publish = useCallback(
    (message: Extract<KneeWorkerResponse, { type: "frame-result" }>) => {
      if (
        message.timestampMs - lastUpdateRef.current < 100 &&
        !message.events.length
      )
        return;
      lastUpdateRef.current = message.timestampMs;
      setSlots(message.lanes);
      const frameTimes = cameraFrameTimesRef.current;
      const elapsed = frameTimes.length > 1 ? frameTimes.at(-1)! - frameTimes[0] : 0;
      const cameraFps = elapsed > 0 ? Math.round((frameTimes.length - 1) * 10000 / elapsed) / 10 : null;
      const frameGaps = frameTimes.slice(1).map((time, index) => time - frameTimes[index]);
      const video = videoRef.current;
      const track = video?.srcObject instanceof MediaStream ? video.srcObject.getVideoTracks()[0] : null;
      const settings = track?.getSettings() ?? null;
      const capabilities = track?.getCapabilities?.();
      const quality = video?.getVideoPlaybackQuality?.();
      const capabilityFrameRate: CameraFpsRange = {
        min: typeof capabilities?.frameRate?.min === "number" ? capabilities.frameRate.min : null,
        max: typeof capabilities?.frameRate?.max === "number" ? capabilities.frameRate.max : null,
      };
      const measured = {
        ...message.metrics,
        cameraFps,
        videoCallbackFps: cameraFps,
        videoFrameGapMs: frameGaps.length ? Math.round(frameGaps.reduce((sum, gap) => sum + gap, 0) / frameGaps.length * 10) / 10 : null,
        presentedFrames: quality?.totalVideoFrames ?? null,
        droppedVideoFrames: quality?.droppedVideoFrames ?? null,
        workerBusyDrops: droppedFramesRef.current,
        droppedFrames: droppedFramesRef.current,
      };
      setMetrics(measured);
      if (message.trace) {
        setTrace((previous) => message.trace!.map((sample, index) => {
          const prior = previous[index];
          if (prior?.timestampMs === sample.timestampMs && prior.participantId === sample.participantId) return prior;
          return sample.algorithmVersion === 3 ? { ...sample, camera: { width: settings?.width ?? video?.videoWidth ?? 0, height: settings?.height ?? video?.videoHeight ?? 0, frameRate: settings?.frameRate ?? null, requestedFrameRate: requestedCameraFpsRef.current, capabilityFrameRate, actualFrameRate: cameraFps, presentedFrames: quality?.totalVideoFrames ?? null, droppedVideoFrames: quality?.droppedVideoFrames ?? null }, runtime: { cameraFps, inferenceFps: measured.inferenceFps, averageLatencyMs: measured.averageLatencyMs, droppedFrames: measured.droppedFrames, videoCallbackFps: measured.videoCallbackFps, videoFrameGapMs: measured.videoFrameGapMs, presentedFrames: measured.presentedFrames, droppedVideoFrames: measured.droppedVideoFrames, workerBusyDrops: measured.workerBusyDrops } } : sample;
        }));
      }
      if (message.events.length)
        setEvents(ledgerRef.current.append(message.events));
    },
    [videoRef],
  );
  const sendFrame = useCallback(
    async (timestampMs: number, purpose: "benchmark" | "preview" | "count") => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      if (inFlightRef.current) { droppedFramesRef.current += 1; return; }
      inFlightRef.current = true;
      try {
        if (workerRef.current) {
          const frame = await createImageBitmap(video);
          const payload = { frame, timestampMs, width: video.videoWidth, height: video.videoHeight, purpose };
          if (workerRef.current) workerRef.current.postMessage({ type: "frame", ...payload }, [frame]);
          else { frame.close(); inFlightRef.current = false; }
          return;
        }
        const result = await mainRuntimeRef.current?.process(video, timestampMs, purpose === "count");
        if (result) publish({ type: "frame-result", timestampMs, ...result });
      } catch (cause) {
        inFlightRef.current = false;
        setError(cause instanceof Error ? cause.message : "Không thể đọc camera.");
      } finally {
        if (!workerRef.current) inFlightRef.current = false;
      }
    },
    [publish, videoRef],
  );
  const startLoop = useCallback(
    (purpose: "preview" | "count") => {
      const video = videoRef.current;
      if (!video) return;
      let stopped = false;
      let raf = 0;
      let videoHandle = 0;
      const rich = video as HTMLVideoElement & {
        requestVideoFrameCallback?: (callback: (now: number) => void) => number;
        cancelVideoFrameCallback?: (handle: number) => void;
      };
      const tick = (time: number) => {
        if (stopped) return;
        cameraFrameTimesRef.current = [...cameraFrameTimesRef.current.filter((value) => time - value <= 3000), time];
        void sendFrame(time, purpose);
        if (rich.requestVideoFrameCallback)
          videoHandle = rich.requestVideoFrameCallback(tick);
        else raf = requestAnimationFrame(tick);
      };
      tick(performance.now());
      stopLoopRef.current = () => {
        stopped = true;
        if (raf) cancelAnimationFrame(raf);
        if (videoHandle) rich.cancelVideoFrameCallback?.(videoHandle);
      };
    },
    [sendFrame, videoRef],
  );
  const updateConfig = useCallback(
    (patch: Partial<KneeCounterSessionConfig>) => {
      if (countingRef.current) {
        countingRef.current = false;
        stopLoopRef.current?.();
        workerRef.current?.postMessage({ type: "pause" });
        workerRef.current?.postMessage({ type: "reset-pending-cycle" });
        mainRuntimeRef.current?.resetPendingCycles();
        setStatus("aligning");
        startLoop("preview");
      }
      setConfig((current) => {
        const next = { ...current, ...patch };
        workerRef.current?.postMessage({ type: "update-config", config: next });
        mainRuntimeRef.current?.updateConfig(next);
        return next;
      });
    },
    [startLoop],
  );
  const fallbackToMainThread = useCallback(async () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    inFlightRef.current = false;
    const runtime = new MainThreadKneeRuntime(
      config,
      sessionIdRef.current,
      sessionStartedAtRef.current,
    );
    const ready = await runtime.init(
      config.backendPreference,
      capabilitiesRef.current
        ? {
            webglSupported: capabilitiesRef.current.webglSupported,
            webgpuAdapterAvailable:
              capabilitiesRef.current.webgpuAdapterAvailable,
          }
        : undefined,
    );
    mainRuntimeRef.current = runtime;
    setCapabilities((current) =>
      current
        ? {
            ...current,
            selectedBackend: ready.backend,
            modelInputSize: ready.inputSize,
            runtime: "main-thread",
          }
        : current,
    );
    if (ready.fallbackToCpu || ready.backend === "wasm") {
      notifyCpuFallback();
    }
    setStatus("aligning");
    startLoop("preview");
  }, [config, notifyCpuFallback, startLoop]);
  const start = useCallback(async () => {
    if (!videoRef.current) return;
    dispose();
    workerReadyRef.current = false;
    hasNotifiedFallbackRef.current = false;
    setFallbackToCpu(false);
    setError(null);
    setSlots([]);
    setTrace([]);
    setEvents([]);
    setMetrics(EMPTY_METRICS);
    ledgerRef.current.clear();
    sessionIdRef.current = crypto.randomUUID();
    sessionStartedAtRef.current = new Date().toISOString();
    setStatus("loading-model");
    try {
      const caps = await detectComputeCapabilities();
      capabilitiesRef.current = caps;
      setCapabilities(caps);
      const worker = createKneeCounterWorker(
        (message) => {
          if (message.type === "detector-ready") {
            workerReadyRef.current = true;
            setCapabilities((current) =>
              current
                ? {
                    ...current,
                    selectedBackend: message.backend,
                    modelInputSize: message.inputSize,
                    runtime: "worker",
                  }
                : current,
            );
            if (message.fallbackToCpu || message.backend === "wasm") {
              notifyCpuFallback();
            }
            setStatus("benchmarking");
            void sendFrame(performance.now(), "benchmark");
          } else if (message.type === "runtime-ready") {
            setMetrics(message.metrics);
            if (message.fallbackToCpu || message.backend === "wasm") {
              notifyCpuFallback();
            }
            setStatus("aligning");
            startLoop("preview");
          } else if (message.type === "frame-result") publish(message);
          else if (message.type === "frame-complete") inFlightRef.current = false;
          else if (message.type === "error") void fallbackToMainThread();
        },
        () => {
          void fallbackToMainThread();
        },
      );
      workerRef.current = worker;
      worker.postMessage({
        type: "init",
        sessionId: sessionIdRef.current,
        sessionStartedAt: sessionStartedAtRef.current,
        config,
        backendPreference: config.backendPreference,
        capabilities: {
          webglSupported: caps.webglSupported,
          webgpuAdapterAvailable: caps.webgpuAdapterAvailable,
        },
      });
      window.setTimeout(() => {
        if (workerRef.current === worker && !workerReadyRef.current)
          void fallbackToMainThread();
      }, 10_000);
    } catch {
      await fallbackToMainThread();
    }
  }, [config, dispose, fallbackToMainThread, notifyCpuFallback, publish, sendFrame, startLoop, videoRef]);
  const pause = useCallback(() => {
    if (status !== "running") return;
    countingRef.current = false;
    stopLoopRef.current?.();
    workerRef.current?.postMessage({ type: "pause" });
    setStatus("paused");
  }, [status]);
  const resume = useCallback(() => {
    if (status !== "paused") return;
    workerRef.current?.postMessage({ type: "resume" });
    workerRef.current?.postMessage({ type: "reset-pending-cycle" });
    mainRuntimeRef.current?.resetPendingCycles();
    setStatus("aligning");
    startLoop("preview");
  }, [startLoop, status]);
  const beginCounting = useCallback(() => {
    if (status !== "aligning") return;
    setStatus("countdown");
  }, [status]);
  const stop = useCallback(async () => {
    dispose();
    countingRef.current = false;
    setStatus("stopped");
  }, [dispose]);
  const reset = useCallback(() => {
    ledgerRef.current.clear();
    setEvents([]);
    setSlots([]);
    setTrace([]);
    workerRef.current?.postMessage({
      type: "reset",
      sessionId: crypto.randomUUID(),
      sessionStartedAt: new Date().toISOString(),
    });
  }, []);
  useEffect(() => () => dispose(), [dispose]);
  const detectedCount = useMemo(
    () => slots.filter((slot) => slot.pose).length,
    [slots],
  );
  const passCount = useMemo(() => countCurrentGroupPass(slots), [slots]);
  useEffect(() => {
    if (status !== "countdown") return;
    const timer = window.setTimeout(() => {
      countingRef.current = true;
      stopLoopRef.current?.();
      startLoop("count");
      setStatus("running");
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [startLoop, status]);
  const latestEventAtMs = events.at(-1)?.crossedAtMs ?? 0;
  const synchronizedGroupPass = useMemo(
    () =>
      isSynchronizedGroup(
        events,
        slots.map((slot) => slot.laneId),
        latestEventAtMs,
        config.synchronizedWindowMs,
      ),
    [config.synchronizedWindowMs, events, latestEventAtMs, slots],
  );
  return {
    config,
    updateConfig,
    status,
    error,
    capabilities,
    slots,
    events,
    metrics,
    detectedCount,
    passCount,
    totalReps: events.length,
    groupPassCount: passCount,
    synchronizedGroupPass,
    trace,
    fallbackToCpu,
    start,
    stop,
    pause,
    resume,
    beginCounting,
    reset,
  };
}
