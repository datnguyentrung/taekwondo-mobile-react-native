import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { DEFAULT_KNEE_COUNTER_CONFIG, inputSizeForProfile } from "../config/kneeCounterConfig";
import { detectComputeCapabilities } from "../ai/gpuCapabilities.web";
import { backendOrder } from "../ai/backendSelector.web";
import { createMoveNetDetector, estimatePersonPoses } from "../ai/moveNetDetector.web";
import { benchmarkDetector } from "../ai/benchmark.web";
import { startInferenceLoop } from "../ai/inferenceLoop.web";
import { evaluateLeg } from "../domain/kneeGeometry";
import { countCurrentGroupPass, isSynchronizedGroup } from "../domain/groupEvaluator";
import { advanceLegState, initialLegCounterState, resetCandidate } from "../domain/motionStateMachine";
import type { ComputeCapabilities, KneeCounterSessionConfig, Leg, LegCounterState, ParticipantSlot, RepEvent, SessionStatus } from "../types/kneeCounter.types";

const MAX_SLOTS = 6;

function emptySlot(index: number): ParticipantSlot {
  return { participantId: `participant-${index + 1}`, label: `VĐV ${index + 1}`, slotIndex: index, trackId: null, pose: null, leftEvaluation: "UNKNOWN", rightEvaluation: "UNKNOWN", leftReps: 0, rightReps: 0, lastEventAtMs: null };
}

export function useKneeCounter(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [config, setConfig] = useState<KneeCounterSessionConfig>(DEFAULT_KNEE_COUNTER_CONFIG);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<ComputeCapabilities | null>(null);
  const [slots, setSlots] = useState<ParticipantSlot[]>(() => Array.from({ length: MAX_SLOTS }, (_, index) => emptySlot(index)));
  const [events, setEvents] = useState<RepEvent[]>([]);
  const detectorRef = useRef<Awaited<ReturnType<typeof createMoveNetDetector>>["detector"] | null>(null);
  const tfRef = useRef<Awaited<ReturnType<typeof createMoveNetDetector>>["tf"] | null>(null);
  const stopLoopRef = useRef<(() => void) | null>(null);
  const legStatesRef = useRef<Map<string, LegCounterState>>(new Map());
  const processFrameRef = useRef<(timestamp: number) => Promise<void>>(async () => undefined);
  const sessionStartedAtRef = useRef<string>("");
  const lastUpdateAtRef = useRef(0);

  const updateConfig = useCallback((patch: Partial<KneeCounterSessionConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
    legStatesRef.current.forEach((state, key) => legStatesRef.current.set(key, resetCandidate(state)));
  }, []);

  const disposeDetector = useCallback(async () => {
    stopLoopRef.current?.();
    stopLoopRef.current = null;
    detectorRef.current?.dispose();
    detectorRef.current = null;
    if (tfRef.current) {
      await tfRef.current.nextFrame();
      tfRef.current = null;
    }
  }, []);

  const processFrame = useCallback(async (timestamp: number) => {
    const detector = detectorRef.current;
    const video = videoRef.current;
    if (!detector || !video || video.readyState < 2) return;
    const poses = await estimatePersonPoses(detector, video, timestamp);
    const visible = poses.filter((pose) => pose.centerX !== null).sort((left, right) => (left.centerX ?? 0) - (right.centerX ?? 0)).slice(0, config.participantCount);
    const nextSlots = Array.from({ length: MAX_SLOTS }, (_, index) => emptySlot(index));
    const nextEvents: RepEvent[] = [];
    visible.forEach((pose, index) => {
      const slot = nextSlots[index];
      slot.trackId = pose.trackId;
      slot.pose = pose;
      const legs: Leg[] = ["left", "right"];
      for (const leg of legs) {
        const evaluation = evaluateLeg(pose.keypoints, leg, config.thresholdPercent, config.minKeypointScore);
        const key = `${slot.participantId}:${leg}`;
        const current = legStatesRef.current.get(key) ?? initialLegCounterState();
        const result = advanceLegState(current, evaluation, timestamp, leg, slot.participantId, pose.trackId, sessionStartedAtRef.current, config.thresholdPercent, config.profile, capabilities?.selectedBackend ?? null, config);
        legStatesRef.current.set(key, result.state);
        if (leg === "left") { slot.leftEvaluation = evaluation.evaluation; slot.leftReps = result.state.reps; } else { slot.rightEvaluation = evaluation.evaluation; slot.rightReps = result.state.reps; }
        if (result.event) { slot.lastEventAtMs = timestamp; nextEvents.push(result.event); }
      }
    });
    if (nextEvents.length) setEvents((current) => [...current, ...nextEvents]);
    if (timestamp - lastUpdateAtRef.current >= 120) { lastUpdateAtRef.current = timestamp; setSlots(nextSlots); }
  }, [capabilities?.selectedBackend, config, videoRef]);

  const start = useCallback(async () => {
    if (!videoRef.current) return;
    setStatus("starting"); setError(null);
    try {
      const detected = capabilities ?? await detectComputeCapabilities();
      setCapabilities(detected);
      const order = backendOrder(config.backendPreference, detected);
      let initialized: Awaited<ReturnType<typeof createMoveNetDetector>> | undefined;
      let selectedBackend: typeof order[number] | undefined;
      for (const backend of order) {
        try { initialized = await createMoveNetDetector(backend, config.profile); selectedBackend = backend; break; } catch { /* try the next backend */ }
      }
      if (!initialized || !selectedBackend) throw new Error("Không thể khởi tạo bộ máy AI. Hãy thử backend khác.");
      detectorRef.current = initialized.detector; tfRef.current = initialized.tf;
      const benchmark = await benchmarkDetector(initialized.detector, videoRef.current);
      setCapabilities((current) => current ? { ...current, selectedBackend, modelInputSize: inputSizeForProfile(config.profile), hardwareAccelerationVerified: selectedBackend === "webgl" || selectedBackend === "webgpu" } : current);
      setCapabilities((current) => current ? { ...current, inferenceFps: benchmark.inferenceFps, p50LatencyMs: benchmark.p50LatencyMs, p95LatencyMs: benchmark.p95LatencyMs } : current);
      sessionStartedAtRef.current = new Date().toISOString();
      setEvents([]); setStatus("running");
      stopLoopRef.current = startInferenceLoop(videoRef.current, (timestamp) => processFrameRef.current(timestamp));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể khởi tạo AI."); setStatus("error"); await disposeDetector(); }
  }, [capabilities, config.backendPreference, config.profile, disposeDetector, videoRef]);

  useEffect(() => { processFrameRef.current = processFrame; }, [processFrame]);
  const stop = useCallback(async () => { await disposeDetector(); setStatus("stopped"); }, [disposeDetector]);
  const pause = useCallback(() => { stopLoopRef.current?.(); stopLoopRef.current = null; setStatus("paused"); }, []);
  const resume = useCallback(() => { if (status !== "paused" || !videoRef.current) return; setStatus("running"); stopLoopRef.current = startInferenceLoop(videoRef.current, (timestamp) => processFrameRef.current(timestamp)); }, [status, videoRef]);
  const reset = useCallback(() => { setEvents([]); setSlots(Array.from({ length: MAX_SLOTS }, (_, index) => emptySlot(index))); legStatesRef.current.clear(); }, []);

  useEffect(() => () => { void disposeDetector(); }, [disposeDetector]);
  const detectedCount = useMemo(() => slots.filter((slot) => slot.pose).length, [slots]);
  const passCount = useMemo(() => slots.filter((slot) => slot.leftEvaluation === "PASS" || slot.rightEvaluation === "PASS").length, [slots]);
  const currentSlots = slots.slice(0, config.participantCount);
  const groupPassCount = useMemo(() => countCurrentGroupPass(currentSlots), [currentSlots]);
  const synchronizedGroupPass = useMemo(() => {
    const participantIds = currentSlots.map((slot) => slot.participantId);
    const leftEvents = events.filter((event) => event.leg === "left");
    const latest = leftEvents.reduce((max, event) => Math.max(max, event.detectedAtMs), -Infinity);
    return latest > -Infinity && isSynchronizedGroup(events, participantIds, latest, config.synchronizedWindowMs, "left");
  }, [currentSlots, events, config.synchronizedWindowMs]);
  return { config, updateConfig, status, error, capabilities, slots: currentSlots, events, detectedCount, passCount, groupPassCount, synchronizedGroupPass, start, stop, pause, resume, reset };
}
