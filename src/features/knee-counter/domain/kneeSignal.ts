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
  const primaryShoulder =
    pose.keypoints[
      isLeft ? MOVENET_KEYPOINT.leftShoulder : MOVENET_KEYPOINT.rightShoulder
    ];
  const oppositeShoulder =
    pose.keypoints[
      isLeft ? MOVENET_KEYPOINT.rightShoulder : MOVENET_KEYPOINT.leftShoulder
    ];
  const primaryHip =
    pose.keypoints[
      isLeft ? MOVENET_KEYPOINT.leftHip : MOVENET_KEYPOINT.rightHip
    ];
  const oppositeHip =
    pose.keypoints[
      isLeft ? MOVENET_KEYPOINT.rightHip : MOVENET_KEYPOINT.leftHip
    ];
  const knee =
    pose.keypoints[
      isLeft ? MOVENET_KEYPOINT.leftKnee : MOVENET_KEYPOINT.rightKnee
    ];
  const oppositeKnee =
    pose.keypoints[
      isLeft ? MOVENET_KEYPOINT.rightKnee : MOVENET_KEYPOINT.leftKnee
    ];
  const ankle =
    pose.keypoints[
      isLeft ? MOVENET_KEYPOINT.leftAnkle : MOVENET_KEYPOINT.rightAnkle
    ];

  let hip = primaryHip;
  if (!isValid(hip, config.minHipScore)) {
    if (isValid(oppositeHip, config.minHipScore)) {
      hip = oppositeHip;
    } else {
      return invalid(
        leg,
        timestampMs,
        config,
        "HIP_LOW_CONFIDENCE",
        (primaryHip as NormalizedPoint | undefined)?.score ?? 0,
      );
    }
  }

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

  let shoulder = primaryShoulder;
  if (!isValid(shoulder, config.minShoulderScore)) {
    if (isValid(oppositeShoulder, config.minShoulderScore)) {
      shoulder = oppositeShoulder;
    }
  }

  let torsoHeight: number;
  if (isValid(shoulder, config.minShoulderScore)) {
    torsoHeight = Math.hypot(shoulder.x - hip.x, shoulder.y - hip.y);
  } else if (isValid(oppositeHip, config.minHipScore)) {
    // 4-point fallback: inter-hip distance * 2.0 approximates torso height
    const interHipWidth = Math.hypot(
      primaryHip.x - oppositeHip.x,
      primaryHip.y - oppositeHip.y,
    );
    torsoHeight = interHipWidth * 2.0;
  } else {
    return invalid(
      leg,
      timestampMs,
      config,
      "SHOULDER_LOW_CONFIDENCE",
      (primaryShoulder as NormalizedPoint | undefined)?.score ?? 0,
    );
  }

  if (torsoHeight < 0.05)
    return invalid(leg, timestampMs, config, "TORSO_TOO_SMALL");

  const isAnkleElevated =
    isValid(ankle, 0.04) && (hip.y - ankle.y) / torsoHeight > -1.1;
  const effectiveKneeScore =
    isAnkleElevated && knee
      ? Math.max(knee.score, config.minKneeWeakScore)
      : (knee?.score ?? 0);

  if (!isValid(knee, config.minKneeWeakScore) && !isAnkleElevated) {
    return invalid(
      leg,
      timestampMs,
      config,
      "KNEE_LOW_CONFIDENCE",
      (knee as NormalizedPoint | undefined)?.score ?? 0,
    );
  }

  const enterThreshold = config.thresholdPercent / 100;
  let ratio = (hip.y - knee.y) / torsoHeight;

  // Pelvis bobbing compensation: when sprinting at high cadence, vertical bounce
  // moves the pelvis up. If opposite leg is down (chân trụ), knee elevation is corroborated.
  if (
    oppositeKnee &&
    isValid(oppositeKnee, config.minKneeWeakScore) &&
    oppositeKnee.y > knee.y
  ) {
    const kneeDiff = (oppositeKnee.y - knee.y) / torsoHeight;
    if (kneeDiff > 0.35) {
      ratio = Math.max(ratio, -0.65 + kneeDiff * 0.8);
    }
  }

  const quality = knee.score >= config.minKneeTrustedScore ? "trusted" : "weak";
  return {
    valid: true,
    leg,
    ratio,
    enterThreshold,
    exitThreshold: enterThreshold - config.hysteresisRatio,
    confidence: Math.min(
      shoulder?.score ?? hip.score,
      hip.score,
      Math.max(knee.score, effectiveKneeScore),
    ),
    kneeConfidence: knee.score,
    quality,
    timestampMs,
    reason: "VALID",
    isAnkleElevated,
  };
}
