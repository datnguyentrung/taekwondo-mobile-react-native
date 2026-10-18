import type { KneeCounterSessionConfig, KneeCounterProfile } from "../types/kneeCounter.types";

export const PROFILE_INPUT_SIZE: Record<KneeCounterProfile, number> = {
  performance: 256,
  balanced: 320,
  quality: 384,
};

export const DEFAULT_KNEE_COUNTER_CONFIG: KneeCounterSessionConfig = {
  maxPeople: 6,
  participantCount: 2,
  thresholdPercent: 0,
  minKeypointScore: 0.6,
  minStableFrames: 2,
  minHoldMs: 50,
  minRepIntervalMs: 150,
  hysteresisRatio: 0.1,
  lostTrackGraceMs: 500,
  synchronizedWindowMs: 300,
  backendPreference: "auto",
  profile: "balanced",
  mode: "individual",
};

export function clampThreshold(value: number) {
  return Math.max(-30, Math.min(30, Math.round(value / 5) * 5));
}

export function inputSizeForProfile(profile: KneeCounterProfile) {
  return PROFILE_INPUT_SIZE[profile];
}
