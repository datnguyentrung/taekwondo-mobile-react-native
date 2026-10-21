/// <reference lib="webworker" />
import { backendOrder } from "./backendSelector.web";
import { createMoveNetRuntime, type MoveNetRuntime } from "./moveNetRuntime.web";
import { LaneManager, deduplicateCandidates, poseToCandidate } from "../domain/laneManager";
import { MAX_TRACKED_PEOPLE } from "../config/kneeCounterConfig";
import { RuntimeMetricsCollector } from "./runtimeMetrics";
import type { KneeWorkerRequest, KneeWorkerResponse } from "./kneeWorkerProtocol";
import type { ComputeBackend, KneeCounterSessionConfig } from "../types/kneeCounter.types";

const worker = self as unknown as DedicatedWorkerGlobalScope;
let runtime: MoveNetRuntime | null = null; let laneManager: LaneManager | null = null; let config: KneeCounterSessionConfig | null = null;
let backend: ComputeBackend | null = null; let sessionId = ""; let sessionStartedAt = ""; let paused = false; const metrics = new RuntimeMetricsCollector();
const emit = (message: KneeWorkerResponse) => worker.postMessage(message);

async function initialize(message: Extract<KneeWorkerRequest, { type: "init" }>) {
  dispose(); config = message.config; sessionId = message.sessionId; sessionStartedAt = message.sessionStartedAt;
  let lastError: unknown;
  for (const candidate of backendOrder(message.backendPreference, { webglSupported: true, webgpuAdapterAvailable: Boolean((self as unknown as { navigator?: Navigator }).navigator?.gpu) })) {
    try { runtime = await createMoveNetRuntime(candidate, 448, config); backend = candidate; laneManager = new LaneManager(config); emit({ type: "detector-ready", backend: candidate, inputSize: 448 }); return; }
    catch (error) { lastError = error; runtime?.dispose(); runtime = null; }
  }
  throw lastError ?? new Error("Không thể tải MoveNet.");
}
async function processFrame(message: Extract<KneeWorkerRequest, { type: "frame" }>) {
  try {
    if (!runtime || !laneManager || !config || !backend) throw new Error("Worker chưa sẵn sàng.");
    if (paused && message.purpose === "count") return;
    const started = performance.now(); const poses = await runtime.estimate(message.frame, message.timestampMs, message.width, message.height, MAX_TRACKED_PEOPLE);
    const candidates = deduplicateCandidates(poses.map(poseToCandidate).filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null));
    const result = laneManager.update(candidates, message.timestampMs, message.purpose === "count", { sessionId, sessionStartedAt, backend, inputSize: runtime.inputSize });
    const currentMetrics = metrics.record(performance.now() - started, 0, result.conflicts);
    if (message.purpose === "benchmark") emit({ type: "runtime-ready", backend, inputSize: runtime.inputSize, metrics: currentMetrics });
    else emit({ type: "frame-result", timestampMs: message.timestampMs, lanes: result.lanes, events: result.events, metrics: currentMetrics, trace: result.trace });
  } catch (error) { emit({ type: "error", code: "FRAME_FAILED", message: error instanceof Error ? error.message : "Không thể phân tích khung hình." }); }
  finally { message.frame.close(); emit({ type: "frame-complete" }); }
}
function dispose() { runtime?.dispose(); runtime = null; laneManager = null; backend = null; }
worker.onmessage = ({ data }: MessageEvent<KneeWorkerRequest>) => {
  if (data.type === "init") void initialize(data).catch((error) => emit({ type: "error", code: "INIT_FAILED", message: error instanceof Error ? error.message : "Không thể khởi tạo worker." }));
  else if (data.type === "frame") void processFrame(data);
  else if (data.type === "pause") paused = true;
  else if (data.type === "resume") paused = false;
  else if (data.type === "reset") { sessionId = data.sessionId; sessionStartedAt = data.sessionStartedAt; laneManager = config ? new LaneManager(config) : null; }
  else if (data.type === "reset-pending-cycle") laneManager?.resetPendingCycles();
  else if (data.type === "dispose") { dispose(); worker.close(); }
};
