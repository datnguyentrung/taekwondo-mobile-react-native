import type { Leg, LegCounterState, KneeEvaluation, RepEvent } from "../types/kneeCounter.types";

export const initialLegCounterState = (): LegCounterState => ({
  phase: "WAITING",
  candidateFrames: 0,
  candidateStartedAtMs: null,
  lastRepAtMs: null,
  reps: 0,
});

export function resetCandidate(state: LegCounterState): LegCounterState {
  return { ...state, phase: "WAITING", candidateFrames: 0, candidateStartedAtMs: null };
}

export function advanceLegState(
  state: LegCounterState,
  evaluation: KneeEvaluation,
  nowMs: number,
  leg: Leg,
  participantId: string,
  trackId: number | null,
  sessionStartedAt: string,
  thresholdPercent: number,
  profile: "performance" | "balanced" | "quality",
  backend: "webgl" | "webgpu" | "wasm" | null,
  config: { minStableFrames: number; minHoldMs: number; minRepIntervalMs: number; hysteresisRatio: number },
): { state: LegCounterState; event?: RepEvent } {
  if (evaluation.evaluation === "UNKNOWN") return { state: { ...state, phase: "UNKNOWN", candidateFrames: 0, candidateStartedAtMs: null } };
  if (state.phase === "UNKNOWN") state = { ...state, phase: "WAITING" };

  if (state.phase === "WAITING") {
    return evaluation.evaluation === "FAIL" ? { state: { ...state, phase: "READY" } } : { state };
  }
  if (state.phase === "READY") {
    if (evaluation.evaluation !== "PASS") return { state };
    return { state: { ...state, phase: "UP_CANDIDATE", candidateFrames: 1, candidateStartedAtMs: nowMs } };
  }
  if (state.phase === "UP_CANDIDATE") {
    if (evaluation.evaluation !== "PASS") return { state: { ...state, phase: "READY", candidateFrames: 0, candidateStartedAtMs: null } };
    const candidateFrames = state.candidateFrames + 1;
    const heldMs = nowMs - (state.candidateStartedAtMs ?? nowMs);
    const canCount = candidateFrames >= config.minStableFrames && heldMs >= config.minHoldMs && (state.lastRepAtMs === null || nowMs - state.lastRepAtMs >= config.minRepIntervalMs);
    if (!canCount) return { state: { ...state, candidateFrames } };
    const nextState = { ...state, phase: "WAIT_DOWN" as const, candidateFrames: 0, candidateStartedAtMs: null, lastRepAtMs: nowMs, reps: state.reps + 1 };
    return {
      state: nextState,
      event: {
        sessionStartedAt,
        detectedAtMs: nowMs,
        participantId,
        trackId,
        leg,
        ratio: evaluation.ratio,
        thresholdPercent,
        backend,
        profile,
        result: "CONFIRMED",
      },
    };
  }

  if (state.phase === "WAIT_DOWN") {
    const downThreshold = evaluation.thresholdRatio - config.hysteresisRatio;
    if (evaluation.ratio !== null && evaluation.ratio <= downThreshold) return { state: { ...state, phase: "READY" } };
  }
  return { state };
}
