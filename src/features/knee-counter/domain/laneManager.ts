import { calculateKneeSignal, missingKneeSignal, MOVENET_KEYPOINT } from "./kneeSignal";
import { advanceLegState, initialLegCounterState, resetPendingCycle } from "./kneeStateMachine";
import type { ComputeBackend, KneeCounterSessionConfig, LaneDefinition, NormalizedPose, ParticipantSlot, PersonPose, RepEvent } from "../types/kneeCounter.types";

export type PoseCandidate = { pose: NormalizedPose; centerX: number; centerY: number };
export type LaneAssignment = { lane: LaneDefinition; candidate: PoseCandidate | null; conflict: boolean };

export function createLaneDefinitions(count: number): LaneDefinition[] {
  return Array.from({ length: count }, (_, index) => ({ laneId: `lane-${index + 1}`, label: `VĐV ${index + 1}`, index, left: index / count, right: (index + 1) / count, centerX: (index + .5) / count }));
}

function validHip(point: { x: number; y: number; score: number } | undefined) { return Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.score >= .25); }
export function poseToCandidate(pose: NormalizedPose): PoseCandidate | null {
  const leftHip = pose.keypoints[MOVENET_KEYPOINT.leftHip]; const rightHip = pose.keypoints[MOVENET_KEYPOINT.rightHip];
  const hips = [leftHip, rightHip].filter(validHip);
  if (!hips.length) return null;
  return { pose, centerX: hips.reduce((sum, hip) => sum + hip.x, 0) / hips.length, centerY: hips.reduce((sum, hip) => sum + hip.y, 0) / hips.length };
}
function iou(a: NonNullable<NormalizedPose["boundingBox"]>, b: NonNullable<NormalizedPose["boundingBox"]>) {
  const left = Math.max(a.xMin, b.xMin); const right = Math.min(a.xMax, b.xMax); const top = Math.max(a.yMin, b.yMin); const bottom = Math.min(a.yMax, b.yMax);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = Math.max(0, a.xMax - a.xMin) * Math.max(0, a.yMax - a.yMin) + Math.max(0, b.xMax - b.xMin) * Math.max(0, b.yMax - b.yMin) - intersection;
  return union ? intersection / union : 0;
}
export function deduplicateCandidates(candidates: PoseCandidate[], max: number) {
  const unique: PoseCandidate[] = [];
  for (const candidate of [...candidates].sort((a, b) => b.pose.poseScore - a.pose.poseScore)) {
    if (unique.some((chosen) => candidate.pose.boundingBox && chosen.pose.boundingBox && iou(candidate.pose.boundingBox, chosen.pose.boundingBox) > .6)) continue;
    unique.push(candidate); if (unique.length >= max) break;
  }
  return unique;
}
export function assignCandidatesToLanes(candidates: PoseCandidate[], lanes: LaneDefinition[], flipHorizontal: boolean): LaneAssignment[] {
  const pairs = candidates.flatMap((candidate, candidateIndex) => {
    const x = flipHorizontal ? 1 - candidate.centerX : candidate.centerX;
    return lanes.filter((lane) => x >= lane.left && x <= lane.right).map((lane) => ({ candidateIndex, laneIndex: lane.index, distance: Math.abs(x - lane.centerX) }));
  }).sort((a, b) => a.distance - b.distance);
  const usedCandidates = new Set<number>(); const usedLanes = new Set<number>(); const assigned = new Map<number, PoseCandidate>();
  for (const pair of pairs) if (!usedCandidates.has(pair.candidateIndex) && !usedLanes.has(pair.laneIndex)) { usedCandidates.add(pair.candidateIndex); usedLanes.add(pair.laneIndex); assigned.set(pair.laneIndex, candidates[pair.candidateIndex]); }
  return lanes.map((lane) => {
    const inLane = candidates.filter((candidate) => { const x = flipHorizontal ? 1 - candidate.centerX : candidate.centerX; return x >= lane.left && x <= lane.right; });
    return { lane, candidate: assigned.get(lane.index) ?? null, conflict: inLane.length > 1 };
  });
}

type LaneMemory = { slot: ParticipantSlot; left: ReturnType<typeof initialLegCounterState>; right: ReturnType<typeof initialLegCounterState> };
export class LaneManager {
  private readonly memories: Map<string, LaneMemory>;
  constructor(private readonly lanes: LaneDefinition[], private readonly config: KneeCounterSessionConfig) {
    this.memories = new Map(lanes.map((lane) => [lane.laneId, { slot: emptySlot(lane), left: initialLegCounterState(), right: initialLegCounterState() }]));
  }
  resetPendingCycles() { this.memories.forEach((memory) => { memory.left = resetPendingCycle(memory.left); memory.right = resetPendingCycle(memory.right); }); }
  update(assignments: LaneAssignment[], timestampMs: number, counting: boolean, context: { sessionId: string; sessionStartedAt: string; backend: ComputeBackend | null; inputSize: 320 | 384 | null }): { lanes: ParticipantSlot[]; events: RepEvent[]; conflicts: number } {
    const events: RepEvent[] = []; let conflicts = 0;
    for (const assignment of assignments) {
      const memory = this.memories.get(assignment.lane.laneId)!; const { slot } = memory; const candidate = assignment.candidate;
      const legContext = () => ({ sessionId: context.sessionId, sessionStartedAt: context.sessionStartedAt, laneId: assignment.lane.laneId, participantId: assignment.lane.label, detectorTrackId: candidate?.pose.detectorTrackId ?? null, thresholdPercent: this.config.thresholdPercent, backend: context.backend, inputSize: context.inputSize, engine: "movenet-multipose-lightning" as const, config: this.config });
      if (assignment.conflict) conflicts += 1;
      if (!candidate) {
        const missing = slot.lastSeenAtMs !== null && timestampMs - slot.lastSeenAtMs > this.config.laneMissingMs;
        if (counting) { memory.left = advanceLegState(memory.left, missingKneeSignal("left", timestampMs, this.config), legContext()).state; memory.right = advanceLegState(memory.right, missingKneeSignal("right", timestampMs, this.config), legContext()).state; }
        memory.slot = { ...slot, pose: null, trackId: null, status: assignment.conflict ? "CONFLICT" : missing ? "MISSING" : "EMPTY", leftPhase: memory.left.phase, rightPhase: memory.right.phase };
        continue;
      }
      const pose = toPersonPose(candidate); const stableFrames = slot.trackId === pose.trackId ? slot.stableFrames + 1 : 1;
      let leftSignal = calculateKneeSignal(pose, "left", timestampMs, this.config); let rightSignal = calculateKneeSignal(pose, "right", timestampMs, this.config);
      if (counting) {
        const left = advanceLegState(memory.left, leftSignal, legContext()); memory.left = left.state; if (left.event) events.push(left.event);
        const right = advanceLegState(memory.right, rightSignal, legContext()); memory.right = right.state; if (right.event) events.push(right.event);
      }
      const ready = stableFrames >= this.config.readyStableFrames && (leftSignal.valid || rightSignal.valid);
      memory.slot = { ...slot, trackId: pose.trackId, pose, confidence: Math.max(leftSignal.confidence, rightSignal.confidence), lastSeenAtMs: timestampMs, stableFrames, status: assignment.conflict ? "CONFLICT" : counting ? "ACTIVE" : ready ? "READY" : "ALIGNING", leftPhase: memory.left.phase, rightPhase: memory.right.phase, leftReps: memory.left.reps, rightReps: memory.right.reps, leftRatio: leftSignal.ratio, rightRatio: rightSignal.ratio };
    }
    return { lanes: this.lanes.map((lane) => this.memories.get(lane.laneId)!.slot), events, conflicts };
  }
}
function emptySlot(lane: LaneDefinition): ParticipantSlot { return { participantId: lane.laneId, label: lane.label, slotIndex: lane.index, laneId: lane.laneId, status: "EMPTY", trackId: null, pose: null, leftReps: 0, rightReps: 0, leftPhase: "NEEDS_DOWN", rightPhase: "NEEDS_DOWN", leftRatio: null, rightRatio: null, confidence: null, stableFrames: 0, lastSeenAtMs: null }; }
function toPersonPose(candidate: PoseCandidate): PersonPose { return { ...candidate.pose, trackId: candidate.pose.detectorTrackId, centerX: candidate.centerX, normalizedBoundingBox: candidate.pose.boundingBox }; }
