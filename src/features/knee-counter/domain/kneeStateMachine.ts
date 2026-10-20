import type { KneeCounterSessionConfig, KneeSignal, LegCounterState, RepEvent } from "../types/kneeCounter.types";

export const initialLegCounterState = (): LegCounterState => ({ phase: "NEEDS_DOWN", reps: 0, lastValidAtMs: null, lastRepAtMs: null, crossedAtMs: null, peakRatio: null, peakConfidence: 0, droppedSamples: 0, sequence: 0 });
export const resetPendingCycle = (state: LegCounterState): LegCounterState => ({ ...state, phase: "NEEDS_DOWN", crossedAtMs: null, peakRatio: null, peakConfidence: 0 });
export type LegCounterContext = Omit<RepEvent, "id" | "leg" | "crossedAtMs" | "completedAtMs" | "peakRatio" | "confidence" | "result"> & { sessionId: string; config: KneeCounterSessionConfig };

export function advanceLegState(state: LegCounterState, signal: KneeSignal, context: LegCounterContext): { state: LegCounterState; event: RepEvent | null } {
  if (!signal.valid || signal.ratio === null) {
    const next = { ...state, droppedSamples: state.droppedSamples + 1 };
    return { state: next.lastValidAtMs !== null && signal.timestampMs - next.lastValidAtMs > context.config.maxSignalGapMs ? resetPendingCycle(next) : next, event: null };
  }
  const nextBase = { ...state, lastValidAtMs: signal.timestampMs, droppedSamples: 0 };
  if (state.phase === "NEEDS_DOWN") return { state: signal.ratio <= signal.exitThreshold ? { ...nextBase, phase: "READY" } : nextBase, event: null };
  if (state.phase === "READY") return { state: signal.ratio >= signal.enterThreshold ? { ...nextBase, phase: "ABOVE", crossedAtMs: signal.timestampMs, peakRatio: signal.ratio, peakConfidence: signal.confidence } : nextBase, event: null };
  const peakRatio = Math.max(state.peakRatio ?? signal.ratio, signal.ratio);
  const peakConfidence = signal.ratio >= (state.peakRatio ?? -Infinity) ? signal.confidence : state.peakConfidence;
  if (signal.ratio > signal.exitThreshold) return { state: { ...nextBase, peakRatio, peakConfidence }, event: null };
  const rearmed = { ...nextBase, phase: "READY" as const, crossedAtMs: null, peakRatio: null, peakConfidence: 0 };
  if (state.lastRepAtMs !== null && signal.timestampMs - state.lastRepAtMs < context.config.minRepIntervalMs) return { state: rearmed, event: null };
  const sequence = state.sequence + 1;
  const event: RepEvent = { ...context, id: `${context.sessionId}:${context.laneId}:${signal.leg}:${sequence}`, leg: signal.leg, crossedAtMs: state.crossedAtMs ?? signal.timestampMs, completedAtMs: signal.timestampMs, peakRatio, confidence: peakConfidence, result: "CONFIRMED" };
  return { state: { ...rearmed, reps: state.reps + 1, sequence, lastRepAtMs: signal.timestampMs }, event };
}
