import { LaneManager, assignCandidatesToLanes, createLaneDefinitions, deduplicateCandidates, poseToCandidate } from "../domain/laneManager";
import { RuntimeMetricsCollector } from "./runtimeMetrics";
import { createMoveNetRuntime, type MoveNetRuntime } from "./moveNetRuntime.web";
import type { BackendPreference, ComputeBackend, KneeCounterSessionConfig, ParticipantSlot, RepEvent, RuntimeMetrics } from "../types/kneeCounter.types";
import { backendOrder } from "./backendSelector.web";

export class MainThreadKneeRuntime {
  private runtime: MoveNetRuntime | null = null; private lanes: LaneManager | null = null; private readonly metrics = new RuntimeMetricsCollector();
  private backend: ComputeBackend | null = null; private inputSize: 320 | 384 = 320;
  constructor(private config: KneeCounterSessionConfig, private sessionId: string, private sessionStartedAt: string) {}
  async init(preference: BackendPreference) {
    let error: unknown;
    for (const backend of backendOrder(preference, { webglSupported: true, webgpuAdapterAvailable: Boolean(navigator.gpu) })) try { this.runtime = await createMoveNetRuntime(backend, 320, this.config); this.backend = backend; this.lanes = new LaneManager(createLaneDefinitions(this.config.participantCount), this.config); return { backend, inputSize: 320 as const }; } catch (cause) { error = cause; this.runtime?.dispose(); }
    throw error ?? new Error("Không thể khởi tạo MoveNet.");
  }
  async process(video: HTMLVideoElement, timestampMs: number, counting: boolean): Promise<{ lanes: ParticipantSlot[]; events: RepEvent[]; metrics: RuntimeMetrics }> {
    if (!this.runtime || !this.lanes) throw new Error("Runtime chưa được khởi tạo."); const started = performance.now();
    const poses = await this.runtime.estimate(video, timestampMs, video.videoWidth, video.videoHeight, this.config.participantCount);
    const candidates = deduplicateCandidates(poses.map(poseToCandidate).filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null), this.config.participantCount);
    const result = this.lanes.update(assignCandidatesToLanes(candidates, createLaneDefinitions(this.config.participantCount), this.config.flipHorizontal), timestampMs, counting, { sessionId: this.sessionId, sessionStartedAt: this.sessionStartedAt, backend: this.backend, inputSize: this.inputSize });
    return { lanes: result.lanes, events: result.events, metrics: this.metrics.record(performance.now() - started, 0, result.conflicts) };
  }
  resetPendingCycles() { this.lanes?.resetPendingCycles(); } dispose() { this.runtime?.dispose(); this.runtime = null; }
}
