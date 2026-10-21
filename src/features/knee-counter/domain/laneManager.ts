import { MAX_TRACKED_PEOPLE } from "../config/kneeCounterConfig";
import { calculateKneeSignal, missingKneeSignal, MOVENET_KEYPOINT } from "./kneeSignal";
import { advanceLegState, initialLegCounterState, resetPendingCycle } from "./kneeStateMachine";
import type { ComputeBackend, KneeCounterSessionConfig, KneeSignal, KneeTraceLeg, KneeTraceSample, LegCounterState, NormalizedPose, ParticipantSlot, PersonPose, RepEvent } from "../types/kneeCounter.types";

export type PoseCandidate = { pose: NormalizedPose; centerX: number; centerY: number };
export const createLaneDefinitions = (count: number) => Array.from({ length: count }, (_, index) => ({ laneId: `lane-${index + 1}`, label: `VĐV ${index + 1}`, index, left: index / count, right: (index + 1) / count, centerX: (index + .5) / count }));
const validHip = (point: { x: number; y: number; score: number } | undefined) => Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.score >= .20);
export function poseToCandidate(pose: NormalizedPose): PoseCandidate | null { const hips = [pose.keypoints[MOVENET_KEYPOINT.leftHip], pose.keypoints[MOVENET_KEYPOINT.rightHip]].filter(validHip); return hips.length ? { pose, centerX: hips.reduce((sum, hip) => sum + hip.x, 0) / hips.length, centerY: hips.reduce((sum, hip) => sum + hip.y, 0) / hips.length } : null; }
function iou(a: NonNullable<NormalizedPose["boundingBox"]>, b: NonNullable<NormalizedPose["boundingBox"]>) { const left = Math.max(a.xMin, b.xMin); const right = Math.min(a.xMax, b.xMax); const top = Math.max(a.yMin, b.yMin); const bottom = Math.min(a.yMax, b.yMax); const intersection = Math.max(0, right - left) * Math.max(0, bottom - top); const union = (a.xMax - a.xMin) * (a.yMax - a.yMin) + (b.xMax - b.xMin) * (b.yMax - b.yMin) - intersection; return union ? intersection / union : 0; }
export function deduplicateCandidates(candidates: PoseCandidate[], max = MAX_TRACKED_PEOPLE) { const unique: PoseCandidate[] = []; for (const candidate of [...candidates].sort((a, b) => b.pose.poseScore - a.pose.poseScore)) { if (unique.some((chosen) => candidate.pose.boundingBox && chosen.pose.boundingBox && iou(candidate.pose.boundingBox, chosen.pose.boundingBox) > .6)) continue; unique.push(candidate); if (unique.length >= max) break; } return unique; }
// Kept for the former unit test; the runtime no longer uses fixed horizontal lanes.
export function assignCandidatesToLanes(candidates: PoseCandidate[], lanes: ReturnType<typeof createLaneDefinitions>, _flipHorizontal: boolean) { return lanes.map((lane) => ({ lane, candidate: candidates.find((candidate) => candidate.centerX >= lane.left && candidate.centerX <= lane.right) ?? null, conflict: false })); }

type RatioSample = { ratio: number; timestampMs: number };
type Memory = { slot: ParticipantSlot; left: ReturnType<typeof initialLegCounterState>; right: ReturnType<typeof initialLegCounterState>; leftRatios: RatioSample[]; rightRatios: RatioSample[]; lastTrustedLeft: KneeSignal | null; lastTrustedRight: KneeSignal | null; lastCenter: { x: number; y: number }; detectorIds: Set<string> };
export class LaneManager {
  private readonly memories = new Map<string, Memory>(); private nextId = 1; private trace: KneeTraceSample[] = [];
  constructor(private config: KneeCounterSessionConfig) {}
  updateConfig(newConfig: KneeCounterSessionConfig) { this.config = newConfig; }
  resetPendingCycles() { this.memories.forEach((memory) => { memory.left = resetPendingCycle(memory.left); memory.right = resetPendingCycle(memory.right); memory.leftRatios = []; memory.rightRatios = []; memory.lastTrustedLeft = null; memory.lastTrustedRight = null; }); }
  getTrace() { return [...this.trace]; }
  update(candidates: PoseCandidate[], timestampMs: number, counting: boolean, context: { sessionId: string; sessionStartedAt: string; backend: ComputeBackend | null; inputSize: 320 | 384 | 448 | null }) {
    const events: RepEvent[] = []; const used = new Set<string>();
    for (const candidate of candidates) {
      const memory = this.match(candidate, used, timestampMs); if (!memory) continue; used.add(memory.slot.participantId);
      const pose = toPersonPose(candidate, memory.slot.participantId); const stableFrames = memory.slot.trackId === pose.trackId ? memory.slot.stableFrames + 1 : 1;
      const rawLeftSignal = calculateKneeSignal(pose, "left", timestampMs, this.config); const rawRightSignal = calculateKneeSignal(pose, "right", timestampMs, this.config);
      const leftSignal = smoothSignal(resolveSignal(rawLeftSignal, memory.leftRatios, memory.lastTrustedLeft), memory.leftRatios, this.config); const rightSignal = smoothSignal(resolveSignal(rawRightSignal, memory.rightRatios, memory.lastTrustedRight), memory.rightRatios, this.config);
      if (rawLeftSignal.valid && rawLeftSignal.quality === "trusted") memory.lastTrustedLeft = rawLeftSignal;
      if (rawRightSignal.valid && rawRightSignal.quality === "trusted") memory.lastTrustedRight = rawRightSignal;
      const leftBefore = memory.left; const rightBefore = memory.right;
      const eventContext = (leg: "left" | "right") => ({ sessionId: context.sessionId, sessionStartedAt: context.sessionStartedAt, laneId: memory.slot.laneId, participantId: memory.slot.participantId, detectorTrackId: candidate.pose.detectorTrackId, thresholdPercent: this.config.thresholdPercent, backend: context.backend, inputSize: context.inputSize, engine: "movenet-multipose-lightning" as const, config: this.config, leg });
      let leftEvent: RepEvent | null = null; let rightEvent: RepEvent | null = null;
      if (counting) { const left = advanceLegState(memory.left, leftSignal, eventContext("left")); memory.left = left.state; leftEvent = left.event; if (left.event) events.push(left.event); const right = advanceLegState(memory.right, rightSignal, eventContext("right")); memory.right = right.state; rightEvent = right.event; if (right.event) events.push(right.event); }
      memory.lastCenter = { x: candidate.centerX, y: candidate.centerY }; if (candidate.pose.detectorTrackId) memory.detectorIds.add(candidate.pose.detectorTrackId);
      memory.slot = { ...memory.slot, trackId: pose.trackId, pose, confidence: Math.max(leftSignal.confidence, rightSignal.confidence), lastSeenAtMs: timestampMs, stableFrames, status: counting ? "ACTIVE" : stableFrames >= this.config.readyStableFrames ? "READY" : "ALIGNING", leftPhase: memory.left.phase, rightPhase: memory.right.phase, leftReps: memory.left.reps, rightReps: memory.right.reps, leftRatio: leftSignal.ratio, rightRatio: rightSignal.ratio };
      this.recordTrace(memory, candidate.pose, timestampMs, rawLeftSignal, rawRightSignal, leftSignal, rightSignal, leftBefore, rightBefore, leftEvent, rightEvent, counting);
    }
    for (const [pId, memory] of this.memories.entries()) {
      if (!used.has(pId) && memory.slot.lastSeenAtMs !== null) {
        const gap = timestampMs - memory.slot.lastSeenAtMs;
        const missing = gap > this.config.laneMissingMs;
        const leftBefore = memory.left; const rightBefore = memory.right;
        const leftSignal = holdSignal(missingKneeSignal("left", timestampMs, this.config), memory.lastTrustedLeft); const rightSignal = holdSignal(missingKneeSignal("right", timestampMs, this.config), memory.lastTrustedRight);
        if (counting) {
          const common = { sessionId: context.sessionId, sessionStartedAt: context.sessionStartedAt, laneId: memory.slot.laneId, participantId: memory.slot.participantId, detectorTrackId: null, thresholdPercent: this.config.thresholdPercent, backend: context.backend, inputSize: context.inputSize, engine: "movenet-multipose-lightning" as const, config: this.config };
          memory.left = advanceLegState(memory.left, leftSignal, common).state;
          memory.right = advanceLegState(memory.right, rightSignal, common).state;
        }
        if (gap <= this.config.laneMissingMs * 2.5) {
          this.recordMissingTrace(memory, timestampMs, leftSignal, rightSignal, leftBefore, rightBefore, counting);
        }
        if (missing) memory.slot = { ...memory.slot, status: "MISSING", trackId: null, pose: null, leftPhase: memory.left.phase, rightPhase: memory.right.phase };
        if (gap > this.config.laneMissingMs * 6) {
          this.memories.delete(pId);
        }
      }
    }
    return { lanes: [...this.memories.values()].map((memory) => memory.slot).sort((a, b) => a.slotIndex - b.slotIndex), events, conflicts: 0, trace: this.getTrace() };
  }
  private match(candidate: PoseCandidate, used: Set<string>, timestampMs: number) { const id = candidate.pose.detectorTrackId; let best = [...this.memories.values()].find((memory) => !used.has(memory.slot.participantId) && Boolean(id && memory.detectorIds.has(id))); if (!best) best = [...this.memories.values()].filter((memory) => !used.has(memory.slot.participantId) && memory.slot.lastSeenAtMs !== null && timestampMs - memory.slot.lastSeenAtMs <= this.config.laneMissingMs).sort((a, b) => distance(a.lastCenter, candidate) - distance(b.lastCenter, candidate))[0]; if (best && distance(best.lastCenter, candidate) <= .18) return best; if (this.memories.size >= MAX_TRACKED_PEOPLE) return null; const index = this.nextId++; const participantId = `participant-${index}`; const memory: Memory = { slot: { participantId, laneId: participantId, label: `VĐV ${index}`, slotIndex: index - 1, status: "ALIGNING", trackId: null, pose: null, leftReps: 0, rightReps: 0, leftPhase: "NEEDS_DOWN", rightPhase: "NEEDS_DOWN", leftRatio: null, rightRatio: null, confidence: null, stableFrames: 0, lastSeenAtMs: null }, left: initialLegCounterState(), right: initialLegCounterState(), leftRatios: [], rightRatios: [], lastTrustedLeft: null, lastTrustedRight: null, lastCenter: { x: candidate.centerX, y: candidate.centerY }, detectorIds: new Set(id ? [id] : []) }; this.memories.set(participantId, memory); return memory; }
  private recordTrace(memory: Memory, pose: NormalizedPose, timestampMs: number, rawLeft: KneeSignal, rawRight: KneeSignal, left: KneeSignal, right: KneeSignal, leftBefore: LegCounterState, rightBefore: LegCounterState, leftEvent: RepEvent | null, rightEvent: RepEvent | null, counting: boolean) { const point = (index: number) => { const value = pose.keypoints[index]; return value ? { x: value.x, y: value.y, score: value.score } : { x: null, y: null, score: 0 }; }; this.pushTrace({ algorithmVersion: 3, config: traceConfig(this.config), timestampMs, source: "POSE", participantId: memory.slot.participantId, detectorTrackId: pose.detectorTrackId, trackId: memory.slot.trackId, poseScore: pose.poseScore, boundingBox: pose.boundingBox, center: memory.lastCenter, hipReferenceY: left.hipReferenceY ?? right.hipReferenceY ?? null, torsoHeight: left.torsoHeight ?? right.torsoHeight ?? null, imageAspectRatio: pose.imageAspectRatio ?? null, points: { leftShoulder: point(5), rightShoulder: point(6), leftHip: point(11), rightHip: point(12), leftKnee: point(13), rightKnee: point(14), leftAnkle: point(15), rightAnkle: point(16) }, left: traceLeg(rawLeft, left, leftBefore, memory.left, leftEvent), right: traceLeg(rawRight, right, rightBefore, memory.right, rightEvent), counting }); }
  private recordMissingTrace(memory: Memory, timestampMs: number, left: KneeSignal, right: KneeSignal, leftBefore: LegCounterState, rightBefore: LegCounterState, counting: boolean) { const missingPoint = { x: null, y: null, score: 0 }; this.pushTrace({ algorithmVersion: 3, config: traceConfig(this.config), timestampMs, source: "MISSING", participantId: memory.slot.participantId, detectorTrackId: null, trackId: memory.slot.trackId, poseScore: null, boundingBox: null, center: memory.lastCenter, hipReferenceY: left.hipReferenceY ?? right.hipReferenceY ?? null, torsoHeight: left.torsoHeight ?? right.torsoHeight ?? null, points: { leftShoulder: missingPoint, rightShoulder: missingPoint, leftHip: missingPoint, rightHip: missingPoint, leftKnee: missingPoint, rightKnee: missingPoint, leftAnkle: missingPoint, rightAnkle: missingPoint }, left: traceLeg(left, left, leftBefore, memory.left, null), right: traceLeg(right, right, rightBefore, memory.right, null), counting }); }
  private pushTrace(sample: KneeTraceSample) {
    this.trace.push(sample);
    if (this.trace.length > 20_000) {
      this.trace.splice(0, this.trace.length - 20_000);
    }
  }
}
function traceLeg(raw: KneeSignal, smoothed: KneeSignal, before: LegCounterState, after: LegCounterState, event: RepEvent | null): KneeTraceLeg { return { reason: smoothed.reason, valid: smoothed.valid, confidence: smoothed.confidence, kneeConfidence: smoothed.kneeConfidence, quality: smoothed.quality, rawRatio: raw.ratio, geometricRatio: raw.geometricRatio ?? null, supportRatio: raw.supportRatio ?? null, smoothedRatio: smoothed.ratio, enterThreshold: smoothed.enterThreshold, exitThreshold: smoothed.exitThreshold, phaseBefore: before.phase, phaseAfter: after.phase, repsBefore: before.reps, repsAfter: after.reps, droppedSamples: after.droppedSamples, lastValidAtMs: after.lastValidAtMs, pendingDirection: after.pendingDirection, pendingSamples: after.pendingSamples, eventId: event?.id ?? null, held: smoothed.held, corroborated: smoothed.corroborated, confirmationReason: smoothed.confirmationReason }; }
function traceConfig(config: KneeCounterSessionConfig) { const { thresholdPercent, minPoseScore, minShoulderScore, minHipScore, minKneeTrustedScore, minKneeWeakScore, weakConfirmationSamples, weakConfirmationWindowMs, smoothingWindowMs, hysteresisRatio, minRepIntervalMs, maxSignalGapMs } = config; return { thresholdPercent, minPoseScore, minShoulderScore, minHipScore, minKneeTrustedScore, minKneeWeakScore, weakConfirmationSamples, weakConfirmationWindowMs, smoothingWindowMs, hysteresisRatio, minRepIntervalMs, maxSignalGapMs }; }
function distance(point: { x: number; y: number }, candidate: PoseCandidate) { return Math.hypot(point.x - candidate.centerX, point.y - candidate.centerY); }
function smoothSignal<T extends KneeSignal>(signal: T, history: RatioSample[], config: KneeCounterSessionConfig): T { if (!signal.valid || signal.ratio === null || signal.held) return signal; const samples = history.filter((sample) => signal.timestampMs - sample.timestampMs <= config.smoothingWindowMs); const prev = samples.at(-1)?.ratio ?? signal.ratio; samples.push({ ratio: signal.ratio, timestampMs: signal.timestampMs }); history.splice(0, history.length, ...samples.slice(-3)); const smoothedRatio = signal.ratio >= prev ? signal.ratio : 0.6 * signal.ratio + 0.4 * prev; return { ...signal, ratio: smoothedRatio }; }
function holdSignal(signal: KneeSignal, trusted: KneeSignal | null): KneeSignal {
  if (signal.valid || !trusted || trusted.ratio === null || signal.timestampMs - trusted.timestampMs > 180) return signal;
  return { ...signal, valid: true, ratio: trusted.ratio, quality: "weak", confidence: trusted.confidence, kneeConfidence: trusted.kneeConfidence, held: true };
}
function resolveSignal(signal: KneeSignal, _history: RatioSample[], trusted: KneeSignal | null): KneeSignal {
  if (!signal.valid) return holdSignal(signal, trusted);
  if (signal.quality === "trusted" || signal.ratio === null) return signal;
  const confirmationReason = signal.supportsWeakKnee
    ? "support"
    : signal.geometricRatio !== undefined && signal.geometricRatio >= signal.enterThreshold
      ? "geometry"
      : undefined;
  return { ...signal, corroborated: Boolean(confirmationReason), confirmationReason };
}
function toPersonPose(candidate: PoseCandidate, participantId: string): PersonPose { return { ...candidate.pose, trackId: candidate.pose.detectorTrackId ?? participantId, centerX: candidate.centerX, normalizedBoundingBox: candidate.pose.boundingBox }; }
