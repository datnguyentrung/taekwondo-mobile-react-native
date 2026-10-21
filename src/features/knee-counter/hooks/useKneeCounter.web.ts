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
};
export function useKneeCounter(
  videoRef: React.RefObject<HTMLVideoElement | null>,
) {
  const [config, setConfig] = useState<KneeCounterSessionConfig>(
    DEFAULT_KNEE_COUNTER_CONFIG,
  );
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<ComputeCapabilities | null>(
    null,
  );
  const [slots, setSlots] = useState<ParticipantSlot[]>([]);
  const [trace, setTrace] = useState<KneeTraceSample[]>([]);
  const [events, setEvents] = useState<RepEvent[]>([]);
  const [metrics, setMetrics] = useState<SessionMetrics>(EMPTY_METRICS);
  const workerRef = useRef<Worker | null>(null);
  const mainRuntimeRef = useRef<MainThreadKneeRuntime | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const inFlightRef = useRef(false);
  const pendingFrameRef = useRef<{ frame: ImageBitmap; timestampMs: number; width: number; height: number; purpose: "benchmark" | "preview" | "count" } | null>(null);
  const countingRef = useRef(false);
  const workerReadyRef = useRef(false);
  const ledgerRef = useRef(new RepEventLedger());
  const sessionIdRef = useRef("");
  const sessionStartedAtRef = useRef("");
  const lastUpdateRef = useRef(0);
  const updateConfig = useCallback(
    (patch: Partial<KneeCounterSessionConfig>) => {
      if (!countingRef.current)
        setConfig((current) => ({ ...current, ...patch }));
    },
    [],
  );
  const dispose = useCallback(() => {
    stopLoopRef.current?.();
    stopLoopRef.current = null;
    inFlightRef.current = false;
    pendingFrameRef.current?.frame.close();
    pendingFrameRef.current = null;
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
      setMetrics(message.metrics);
      if (message.trace) setTrace(message.trace);
      if (message.events.length)
        setEvents(ledgerRef.current.append(message.events));
    },
    [],
  );
  const sendFrame = useCallback(
    async (timestampMs: number, purpose: "benchmark" | "preview" | "count") => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        if (workerRef.current) {
          const frame = await createImageBitmap(video);
          const payload = { frame, timestampMs, width: video.videoWidth, height: video.videoHeight, purpose };
          if (inFlightRef.current) {
            pendingFrameRef.current?.frame.close();
            pendingFrameRef.current = payload;
            return;
          }
          inFlightRef.current = true;
          workerRef.current.postMessage({ type: "frame", ...payload }, [frame]);
          return;
        }
        inFlightRef.current = true;
        const result = await mainRuntimeRef.current?.process(video, timestampMs, purpose === "count");
        if (result) publish({ type: "frame-result", timestampMs, ...result });
      } catch (cause) {
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
  const fallbackToMainThread = useCallback(async () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    const runtime = new MainThreadKneeRuntime(
      config,
      sessionIdRef.current,
      sessionStartedAtRef.current,
    );
    const ready = await runtime.init(config.backendPreference);
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
    setStatus("aligning");
    startLoop("preview");
  }, [config, startLoop]);
  const start = useCallback(async () => {
    if (!videoRef.current) return;
    dispose();
    workerReadyRef.current = false;
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
      setCapabilities(await detectComputeCapabilities());
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
            setStatus("benchmarking");
            void sendFrame(performance.now(), "benchmark");
          } else if (message.type === "runtime-ready") {
            setMetrics(message.metrics);
            setStatus("aligning");
            startLoop("preview");
          } else if (message.type === "frame-result") publish(message);
          else if (message.type === "frame-complete") {
            const pending = pendingFrameRef.current;
            pendingFrameRef.current = null;
            if (pending && workerRef.current) {
              inFlightRef.current = true;
              workerRef.current.postMessage({ type: "frame", ...pending }, [pending.frame]);
            } else {
              inFlightRef.current = false;
            }
          }
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
      });
      window.setTimeout(() => {
        if (workerRef.current === worker && !workerReadyRef.current)
          void fallbackToMainThread();
      }, 10_000);
    } catch {
      await fallbackToMainThread();
    }
  }, [config, dispose, fallbackToMainThread, publish, sendFrame, startLoop, videoRef]);
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
    start,
    stop,
    pause,
    resume,
    beginCounting,
    reset,
  };
}
