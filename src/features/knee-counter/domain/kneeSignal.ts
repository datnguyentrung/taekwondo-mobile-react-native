import type { KneeCounterSessionConfig, KneeSignal, Leg, NormalizedPoint, NormalizedPose } from "../types/kneeCounter.types";

export const MOVENET_KEYPOINT = { leftShoulder: 5, rightShoulder: 6, leftHip: 11, rightHip: 12, leftKnee: 13, rightKnee: 14 } as const;
const isValid = (point: NormalizedPoint | undefined, score: number): point is NormalizedPoint => Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.score >= score);

function invalid(leg: Leg, timestampMs: number, config: KneeCounterSessionConfig, reason: KneeSignal["reason"], confidence = 0): KneeSignal {
  const enterThreshold = config.thresholdPercent / 100;
  return { valid: false, leg, ratio: null, enterThreshold, exitThreshold: enterThreshold - config.hysteresisRatio, confidence, timestampMs, reason };
}
export const missingKneeSignal = (leg: Leg, timestampMs: number, config: KneeCounterSessionConfig) => invalid(leg, timestampMs, config, "MISSING_FRAME");

export function calculateKneeSignal(pose: NormalizedPose, leg: Leg, timestampMs: number, config: KneeCounterSessionConfig): KneeSignal {
  if (pose.poseScore < config.minPoseScore) return invalid(leg, timestampMs, config, "POSE_LOW_CONFIDENCE", pose.poseScore);
  const shoulder = pose.keypoints[leg === "left" ? MOVENET_KEYPOINT.leftShoulder : MOVENET_KEYPOINT.rightShoulder];
  const hip = pose.keypoints[leg === "left" ? MOVENET_KEYPOINT.leftHip : MOVENET_KEYPOINT.rightHip];
  const knee = pose.keypoints[leg === "left" ? MOVENET_KEYPOINT.leftKnee : MOVENET_KEYPOINT.rightKnee];
  if (!isValid(shoulder, config.minKeypointScore)) return invalid(leg, timestampMs, config, "SHOULDER_LOW_CONFIDENCE", (shoulder as NormalizedPoint | undefined)?.score ?? 0);
  if (!isValid(hip, config.minKeypointScore)) return invalid(leg, timestampMs, config, "HIP_LOW_CONFIDENCE", (hip as NormalizedPoint | undefined)?.score ?? 0);
  if (!isValid(knee, config.minKeypointScore)) return invalid(leg, timestampMs, config, "KNEE_LOW_CONFIDENCE", (knee as NormalizedPoint | undefined)?.score ?? 0);
  const torsoHeight = Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y);
  if (torsoHeight < 0.05) return invalid(leg, timestampMs, config, "TORSO_TOO_SMALL");
  const enterThreshold = config.thresholdPercent / 100;
  return { valid: true, leg, ratio: (hip.y - knee.y) / torsoHeight, enterThreshold, exitThreshold: enterThreshold - config.hysteresisRatio, confidence: Math.min(shoulder.score, hip.score, knee.score), timestampMs, reason: "VALID" };
}
