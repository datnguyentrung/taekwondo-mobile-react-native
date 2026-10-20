import type { KneeCounterSessionConfig } from "../types/kneeCounter.types";

export const DEFAULT_KNEE_COUNTER_CONFIG: KneeCounterSessionConfig = {
  participantCount: 2,
  thresholdPercent: 0,
  minPoseScore: 0.25,
  minKeypointScore: 0.45,
  minRepIntervalMs: 220,
  hysteresisRatio: 0.08,
  maxSignalGapMs: 250,
  laneMissingMs: 700,
  readyStableFrames: 5,
  synchronizedWindowMs: 300,
  backendPreference: "auto",
  mode: "individual",
  flipHorizontal: false,
};

export function clampThreshold(value: number) {
  return Math.max(-30, Math.min(30, Math.round(value / 5) * 5));
}

