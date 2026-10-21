import type {
  KneeCounterSessionConfig,
  KneeSignal,
  Leg,
  NormalizedPoint,
  NormalizedPose,
} from "../types/kneeCounter.types";

export const MOVENET_KEYPOINT = {
  leftShoulder: 5,
  rightShoulder: 6,
  leftHip: 11,
  rightHip: 12,
  leftKnee: 13,
  rightKnee: 14,
  leftAnkle: 15,
  rightAnkle: 16,
} as const;

const isValid = (
  point: NormalizedPoint | undefined,
  score: number,
): point is NormalizedPoint =>
  Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.score >= score);

function invalid(
  leg: Leg,
  timestampMs: number,
  config: KneeCounterSessionConfig,
  reason: KneeSignal["reason"],
  confidence = 0,
): KneeSignal {
  const enterThreshold = config.thresholdPercent / 100;
  return { valid: false, leg, ratio: null, enterThreshold, exitThreshold: enterThreshold - config.hysteresisRatio, confidence, kneeConfidence: 0, quality: "invalid", timestampMs, reason };
}

export const missingKneeSignal = (leg: Leg, timestampMs: number, config: KneeCounterSessionConfig) =>
  invalid(leg, timestampMs, config, "MISSING_FRAME");

/** Exact per-leg v1 geometry, shared by scoring and threshold lines. */
export function legKneeReference(
  pose: NormalizedPose,
  leg: Leg,
  config: KneeCounterSessionConfig,
) {
  const isLeft = leg === "left";
  const primaryShoulder = pose.keypoints[isLeft ? MOVENET_KEYPOINT.leftShoulder : MOVENET_KEYPOINT.rightShoulder];
  const oppositeShoulder = pose.keypoints[isLeft ? MOVENET_KEYPOINT.rightShoulder : MOVENET_KEYPOINT.leftShoulder];
  const primaryHip = pose.keypoints[isLeft ? MOVENET_KEYPOINT.leftHip : MOVENET_KEYPOINT.rightHip];
  const oppositeHip = pose.keypoints[isLeft ? MOVENET_KEYPOINT.rightHip : MOVENET_KEYPOINT.leftHip];
  const hip = isValid(primaryHip, config.minHipScore)
    ? primaryHip
    : isValid(oppositeHip, config.minHipScore) ? oppositeHip : null;
  if (!hip) return { hip: null, shoulder: null, torsoHeight: null };
  const shoulder = isValid(primaryShoulder, config.minShoulderScore)
    ? primaryShoulder
    : isValid(oppositeShoulder, config.minShoulderScore) ? oppositeShoulder : null;
  const torsoHeight = shoulder
    ? Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y)
    : isValid(oppositeHip, config.minHipScore)
      ? Math.hypot(primaryHip.x - oppositeHip.x, primaryHip.y - oppositeHip.y) * 2
      : null;
  return { hip, shoulder, torsoHeight };
}

export function calculateKneeSignal(
  pose: NormalizedPose,
  leg: Leg,
  timestampMs: number,
  config: KneeCounterSessionConfig,
): KneeSignal {
  if (pose.poseScore < config.minPoseScore) return invalid(leg, timestampMs, config, "POSE_LOW_CONFIDENCE", pose.poseScore);
  const isLeft = leg === "left";
  const reference = legKneeReference(pose, leg, config);
  const primaryHip = pose.keypoints[isLeft ? MOVENET_KEYPOINT.leftHip : MOVENET_KEYPOINT.rightHip];
  const primaryShoulder = pose.keypoints[isLeft ? MOVENET_KEYPOINT.leftShoulder : MOVENET_KEYPOINT.rightShoulder];
  if (!reference.hip) return invalid(leg, timestampMs, config, "HIP_LOW_CONFIDENCE", primaryHip?.score ?? 0);
  if (reference.torsoHeight === null) return invalid(leg, timestampMs, config, "SHOULDER_LOW_CONFIDENCE", primaryShoulder?.score ?? 0);
  if (reference.torsoHeight < 0.05) return invalid(leg, timestampMs, config, "TORSO_TOO_SMALL");

  const { hip, shoulder, torsoHeight } = reference;
  const knee = pose.keypoints[isLeft ? MOVENET_KEYPOINT.leftKnee : MOVENET_KEYPOINT.rightKnee];
  const oppositeKnee = pose.keypoints[isLeft ? MOVENET_KEYPOINT.rightKnee : MOVENET_KEYPOINT.leftKnee];
  const ankle = pose.keypoints[isLeft ? MOVENET_KEYPOINT.leftAnkle : MOVENET_KEYPOINT.rightAnkle];
  const proximityHipMaxY = config.proximityHipMaxY ?? 0.65;
  const proximityKneeMaxY = config.proximityKneeMaxY ?? 0.94;
  if (hip.y > proximityHipMaxY || (knee && knee.y > proximityKneeMaxY && hip.y > 0.58)) return invalid(leg, timestampMs, config, "PROXIMITY_TOO_CLOSE", hip.score);

  const kneeConfidence = knee?.score ?? 0;
  const isAnkleElevated = isValid(ankle, 0.04) && (hip.y - ankle.y) / torsoHeight > -1.1;
  const effectiveKneeScore = isAnkleElevated && knee ? Math.max(knee.score, config.minKneeWeakScore) : kneeConfidence;
  if (!knee || (!isValid(knee, config.minKneeWeakScore) && !isAnkleElevated)) return invalid(leg, timestampMs, config, "KNEE_LOW_CONFIDENCE", kneeConfidence);

  const enterThreshold = config.thresholdPercent / 100;
  const geometricRatio = (hip.y - knee.y) / torsoHeight;
  let supportRatio: number | null = null;
  if (isValid(oppositeKnee, config.minKneeWeakScore) && oppositeKnee.y > knee.y) {
    const kneeDifference = (oppositeKnee.y - knee.y) / torsoHeight;
    if (kneeDifference > 0.35) supportRatio = -0.65 + kneeDifference * 0.8;
  }
  const ratio = supportRatio === null ? geometricRatio : Math.max(geometricRatio, supportRatio);
  const supportsWeakKnee = supportRatio !== null && supportRatio > geometricRatio;
  const quality = knee.score >= config.minKneeTrustedScore ? "trusted" : "weak";
  return {
    valid: true, leg, ratio, geometricRatio, supportRatio: supportRatio ?? undefined, supportsWeakKnee,
    enterThreshold, exitThreshold: enterThreshold - config.hysteresisRatio,
    confidence: Math.min(shoulder?.score ?? hip.score, hip.score, Math.max(knee.score, effectiveKneeScore)),
    kneeConfidence: knee.score, quality, timestampMs, reason: "VALID", isAnkleElevated,
    hipReferenceY: hip.y, torsoHeight,
  };
}
