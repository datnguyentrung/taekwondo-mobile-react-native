import { LaneManager, deduplicateCandidates, poseToCandidate } from "../domain/laneManager";
import { MAX_TRACKED_PEOPLE } from "../config/kneeCounterConfig";
import { RuntimeMetricsCollector } from "./runtimeMetrics";
import { createMoveNetRuntime, type MoveNetRuntime } from "./moveNetRuntime.web";
import type { BackendPreference, ComputeBackend, KneeCounterSessionConfig, KneeTraceSample, ParticipantSlot, RepEvent, RuntimeMetrics } from "../types/kneeCounter.types";
import { backendOrder } from "./backendSelector.web";

export class MainThreadKneeRuntime {
  private runtime: MoveNetRuntime | null = null; private lanes: LaneManager | null = null; private readonly metrics = new RuntimeMetricsCollector();
  private backend: ComputeBackend | null = null; private inputSize: 320 | 384 | 448 = 384;
  constructor(private config: KneeCounterSessionConfig, private sessionId: string, private sessionStartedAt: string) {}
  async init(
    preference: BackendPreference,
    capabilities?: { webglSupported: boolean; webgpuAdapterAvailable: boolean }
  ) {
    let error: unknown;
    const resolvedCapabilities = capabilities ?? {
      webglSupported: true,
      webgpuAdapterAvailable: Boolean(navigator.gpu),
    };
    for (const backend of backendOrder(preference, resolvedCapabilities))
      try {
        this.runtime = await createMoveNetRuntime(backend, 384, this.config);
        this.backend = backend;
        this.lanes = new LaneManager(this.config);
        return {
          backend,
          inputSize: 384 as const,
          fallbackToCpu: backend === "wasm",
        };
      } catch (cause) {
        error = cause;
        this.runtime?.dispose();
      }
    throw error ?? new Error("Không thể khởi tạo MoveNet.");
  }
  async process(video: HTMLVideoElement, timestampMs: number, counting: boolean): Promise<{ lanes: ParticipantSlot[]; events: RepEvent[]; metrics: RuntimeMetrics; trace: KneeTraceSample[] }> {
    if (!this.runtime || !this.lanes) throw new Error("Runtime chưa được khởi tạo."); const started = performance.now();
    const poses = await this.runtime.estimate(video, timestampMs, video.videoWidth, video.videoHeight, MAX_TRACKED_PEOPLE);
    const candidates = deduplicateCandidates(poses.map(poseToCandidate).filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null));
    const result = this.lanes.update(candidates, timestampMs, counting, { sessionId: this.sessionId, sessionStartedAt: this.sessionStartedAt, backend: this.backend, inputSize: this.inputSize });
    return { lanes: result.lanes, events: result.events, metrics: this.metrics.record(performance.now() - started, 0, result.conflicts), trace: result.trace };
  }
  resetPendingCycles() { this.lanes?.resetPendingCycles(); } dispose() { this.runtime?.dispose(); this.runtime = null; }
}
