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
  Boolean(
    point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.score >= score,
  );

function invalid(
  leg: Leg,
  timestampMs: number,
  config: KneeCounterSessionConfig,
  reason: KneeSignal["reason"],
  confidence = 0,
): KneeSignal {
  const enterThreshold = config.thresholdPercent / 100;
  return {
    valid: false,
    leg,
    ratio: null,
    enterThreshold,
    exitThreshold: enterThreshold - config.hysteresisRatio,
    confidence,
    kneeConfidence: 0,
    quality: "invalid",
    timestampMs,
    reason,
  };
}
export const missingKneeSignal = (
  leg: Leg,
  timestampMs: number,
  config: KneeCounterSessionConfig,
) => invalid(leg, timestampMs, config, "MISSING_FRAME");

/** The scoring and drawing paths share this pelvis reference. Distances are in image-height units. */
export function kneeReference(pose: NormalizedPose, config: KneeCounterSessionConfig) {
  const hips = [pose.keypoints[MOVENET_KEYPOINT.leftHip], pose.keypoints[MOVENET_KEYPOINT.rightHip]]
    .filter((point) => isValid(point, config.minHipScore));
  if (!hips.length) return null;
  const hip = {
    x: hips.reduce((sum, point) => sum + point.x, 0) / hips.length,
    y: hips.reduce((sum, point) => sum + point.y, 0) / hips.length,
    score: Math.min(...hips.map((point) => point.score)),
  };
  const shoulders = [pose.keypoints[MOVENET_KEYPOINT.leftShoulder], pose.keypoints[MOVENET_KEYPOINT.rightShoulder]]
    .filter((point) => isValid(point, config.minShoulderScore));
  const aspect = pose.imageAspectRatio && Number.isFinite(pose.imageAspectRatio) ? pose.imageAspectRatio : 16 / 9;
  let torsoHeight: number | null = null;
  if (shoulders.length) {
    const shoulderX = shoulders.reduce((sum, point) => sum + point.x, 0) / shoulders.length;
    const shoulderY = shoulders.reduce((sum, point) => sum + point.y, 0) / shoulders.length;
    torsoHeight = Math.hypot((shoulderX - hip.x) * aspect, shoulderY - hip.y);
  } else if (hips.length === 2) {
    torsoHeight = Math.hypot((hips[0].x - hips[1].x) * aspect, hips[0].y - hips[1].y) * 2;
  }
  return { hip, torsoHeight, shoulderScore: shoulders.length ? Math.min(...shoulders.map((point) => point.score)) : null };
}

export function calculateKneeSignal(
  pose: NormalizedPose,
  leg: Leg,
  timestampMs: number,
  config: KneeCounterSessionConfig,
): KneeSignal {
  if (pose.poseScore < config.minPoseScore)
    return invalid(
      leg,
      timestampMs,
      config,
      "POSE_LOW_CONFIDENCE",
      pose.poseScore,
    );
  const isLeft = leg === "left";
  const reference = kneeReference(pose, config);
  if (!reference) return invalid(leg, timestampMs, config, "HIP_LOW_CONFIDENCE");
  const { hip, torsoHeight, shoulderScore } = reference;
  if (torsoHeight === null) return invalid(leg, timestampMs, config, "SHOULDER_LOW_CONFIDENCE");
  if (torsoHeight < 0.05) return invalid(leg, timestampMs, config, "TORSO_TOO_SMALL");
  const knee =
    pose.keypoints[
      isLeft ? MOVENET_KEYPOINT.leftKnee : MOVENET_KEYPOINT.rightKnee
    ];
  const oppositeKnee =
    pose.keypoints[
      isLeft ? MOVENET_KEYPOINT.rightKnee : MOVENET_KEYPOINT.leftKnee
    ];
  const ankle = pose.keypoints[isLeft ? MOVENET_KEYPOINT.leftAnkle : MOVENET_KEYPOINT.rightAnkle];

  // Proximity Guard: prevent false counts when participant walks too close to camera
  const proximityHipMaxY = config.proximityHipMaxY ?? 0.65;
  const proximityKneeMaxY = config.proximityKneeMaxY ?? 0.94;
  if (
    hip.y > proximityHipMaxY ||
    (knee && knee.y > proximityKneeMaxY && hip.y > 0.58)
  ) {
    return invalid(
      leg,
      timestampMs,
      config,
      "PROXIMITY_TOO_CLOSE",
      hip.score,
    );
  }

  if (!isValid(knee, config.minKneeWeakScore)) {
    return invalid(
      leg,
      timestampMs,
      config,
      "KNEE_LOW_CONFIDENCE",
      (knee as NormalizedPoint | undefined)?.score ?? 0,
    );
  }

  const enterThreshold = config.thresholdPercent / 100;
  const ratio = (hip.y - knee.y) / torsoHeight;
  const isAnkleElevated = isValid(ankle, config.minKneeTrustedScore) && ankle.y < hip.y + torsoHeight * 1.1;
  const oppositeLegDown = isValid(oppositeKnee, config.minKneeTrustedScore) && oppositeKnee.y > knee.y + torsoHeight * 0.35;

  const quality = knee.score >= config.minKneeTrustedScore ? "trusted" : "weak";
  return {
    valid: true,
    leg,
    ratio,
    enterThreshold,
    exitThreshold: enterThreshold - config.hysteresisRatio,
    confidence: Math.min(shoulderScore ?? hip.score, hip.score, knee.score),
    kneeConfidence: knee.score,
    quality,
    timestampMs,
    reason: "VALID",
    isAnkleElevated: isAnkleElevated || oppositeLegDown,
    corroborated: false,
    hipReferenceY: hip.y,
    torsoHeight,
  };
}
